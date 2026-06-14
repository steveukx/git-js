import { LineParser } from '../parsing/line-parser';
import { asNumber } from '../parsing/parse.helpers';
import { parseStringResponse } from '../parsing/parse-string-response';
import { ExitCodes } from '../task/exit-codes';
import type { StringTask } from '../task/task.types';

export interface VersionResult {
   major: number;
   minor: number;
   patch: number | string;
   agent: string;
   installed: boolean;
}

const NOT_INSTALLED = 'installed=false';

function versionResponse(
   major = 0,
   minor = 0,
   patch: number | string = 0,
   agent = '',
   installed = true
): VersionResult {
   return Object.defineProperty({ major, minor, patch, agent, installed }, 'toString', {
      value(this: VersionResult) {
         return `${this.major}.${this.minor}.${this.patch}`;
      },
      configurable: false,
      enumerable: false,
   });
}

const parsers: LineParser<VersionResult>[] = [
   new LineParser(
      /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
      (result, [major, minor, patch, agent = '']) => {
         Object.assign(
            result,
            versionResponse(asNumber(major), asNumber(minor), asNumber(patch), agent)
         );
      }
   ),
   new LineParser(
      /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
      (result, [major, minor, patch, agent = '']) => {
         Object.assign(result, versionResponse(asNumber(major), asNumber(minor), patch, agent));
      }
   ),
];

export function parseVersion(stdOut: string): VersionResult {
   if (stdOut === NOT_INSTALLED) {
      return versionResponse(0, 0, 0, '', false);
   }

   return parseStringResponse(versionResponse(0, 0, 0, stdOut), parsers, stdOut);
}

/**
 * Reports the version of the git binary in use. When git cannot be found the task
 * resolves to a not-installed result rather than rejecting, so callers can probe
 * availability without a try/catch.
 */
export function version(): StringTask<VersionResult> {
   return {
      format: 'utf-8',
      commands: ['--version'],
      parser: parseVersion,
      onError({ exitCode }, error, done, fail) {
         if (exitCode === ExitCodes.NOT_FOUND) {
            return done(Buffer.from(NOT_INSTALLED));
         }

         fail(error);
      },
   };
}
