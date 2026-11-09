import { TemplateValue } from './template-values';

/**
 * Every kind of remote `remoteUrl` can accept: url schemes, plus `scp` for the scp-like
 * `user@host:path` syntax and `local` for plain file-system paths.
 */
const REMOTE_PROTOCOLS = [
   'https',
   'http',
   'ssh',
   'git+ssh',
   'ssh+git',
   'git',
   'file',
   'scp',
   'local',
] as const;

export type RemoteProtocol = (typeof REMOTE_PROTOCOLS)[number];

export interface RemoteUrlOptions {
   /**
    * Kinds of remote to accept, defaults to all of them: the `https`, `http`, `ssh` (and its
    * `git+ssh` / `ssh+git` aliases), `git` and `file` url schemes, `scp` for the scp-like
    * `user@host:path` syntax and `local` for plain file-system paths.
    */
   protocols?: ReadonlyArray<RemoteProtocol>;
}

const DEFAULT_PROTOCOLS: ReadonlySet<string> = new Set(REMOTE_PROTOCOLS);

const URL_SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;
const SCP_LIKE = /^(?:([^@/]+)@)?([^/:]+):(?!\/\/)/;

/**
 * Marks an interpolated template value as a remote repository url, rejecting anything other
 * than a well-formed url using a safe protocol.
 *
 * ```typescript
 * await git.cmd`clone --depth 1 ${remoteUrl(userInput)} ${pathspec(target)}`;
 * await git.cmd`ls-remote ${remoteUrl(userInput, { protocols: ['https'] })}`;
 * ```
 */
export function remoteUrl(value: string, { protocols }: RemoteUrlOptions = {}) {
   const allowed = protocols ? new Set<string>(protocols) : DEFAULT_PROTOCOLS;

   return new TemplateValue(String(value), (url) => {
      const scheme = URL_SCHEME.exec(url)?.[1]?.toLowerCase();

      if (scheme !== undefined) {
         if (!allowed.has(scheme)) {
            return `protocol "${scheme}" is not permitted`;
         }

         let parsed: URL;
         try {
            parsed = new URL(url);
         } catch {
            return `not a valid url`;
         }

         if (
            parsed.hostname.startsWith('-') ||
            decodeURIComponent(parsed.username).startsWith('-')
         ) {
            return `host and user names must not start with "-"`;
         }
         return undefined;
      }

      const scp = SCP_LIKE.exec(url);
      if (scp && !/^[a-z]:[\\/]/i.test(url)) {
         if (!allowed.has('scp')) {
            return `scp-like urls are not permitted`;
         }
         if (scp[1]?.startsWith('-') || scp[2].startsWith('-')) {
            return `host and user names must not start with "-"`;
         }
         return undefined;
      }

      return allowed.has('local') ? undefined : `local paths are not permitted`;
   });
}
