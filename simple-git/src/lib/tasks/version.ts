import type { SimpleGitApi } from '../simple-git-api';
import type { SimpleGit } from '../../../typings';
import { asNumber, ExitCodes, LineParser, parseStringResponse } from '../utils';

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
   patch: string | number = 0,
   agent = '',
   installed = true
): VersionResult {
   return Object.defineProperty(
      {
         major,
         minor,
         patch,
         agent,
         installed,
      },
      'toString',
      {
         value() {
            return `${this.major}.${this.minor}.${this.patch}`;
         },
         configurable: false,
         enumerable: false,
      }
   );
}

function notInstalledResponse() {
   return versionResponse(0, 0, 0, '', false);
}

export default function (): Pick<SimpleGit, 'version'> {
   return {
      version(this: SimpleGitApi) {
         return this._runTask({
            commands: ['--version'],
            format: 'utf-8',
            parser: versionParser,
            onError(result, error, done, fail) {
               if (result.exitCode === ExitCodes.NOT_FOUND) {
                  return done(Buffer.from(NOT_INSTALLED));
               }

               fail(error);
            },
         });
      },
   };
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

function versionParser(stdOut: string) {
   if (stdOut === NOT_INSTALLED) {
      return notInstalledResponse();
   }

   return parseStringResponse(versionResponse(0, 0, 0, stdOut), parsers, stdOut);
}
