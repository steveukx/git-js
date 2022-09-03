import type { SimpleGitApi } from '../simple-git-api';
import type { SimpleGit } from '../../../typings';
import { asNumber, ExitCodes } from '../utils';

export interface VersionResult {
   major: number;
   minor: number;
   patch: number;
   agent: string;
   installed: boolean;
}

const NOT_INSTALLED = 'installed=false';

function versionResponse(
   major = 0,
   minor = 0,
   patch = 0,
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
            return `${major}.${minor}.${patch}`;
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
            parser(stdOut) {
               if (stdOut === NOT_INSTALLED) {
                  return notInstalledResponse();
               }

               const version = /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/.exec(stdOut);

               if (!version) {
                  return versionResponse(0, 0, 0, stdOut);
               }

               return versionResponse(
                  asNumber(version[1]),
                  asNumber(version[2]),
                  asNumber(version[3]),
                  version[4] || ''
               );
            },
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
