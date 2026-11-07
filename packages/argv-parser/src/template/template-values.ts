/**
 * Wrapper for an interpolated template value that must pass extra validation before use, see
 * `remoteUrl` and `refName`.
 */
export class TemplateValue {
   constructor(
      public readonly value: string,
      public readonly validate: (value: string) => string | undefined
   ) {}
}

export type TemplateArgvValue =
   | string
   | number
   | TemplateValue
   | ReadonlyArray<string | number | TemplateValue>;

const SAFE_PROTOCOLS = ['https', 'http', 'ssh', 'git', 'file', 'git+ssh', 'ssh+git'] as const;
type SafeProtocol = (typeof SAFE_PROTOCOLS)[number];

export interface RemoteUrlOptions {
   /**
    * Protocols to accept, defaults to all of `https`, `http`, `ssh`, `git` and `file`
    * (`git+ssh` and `ssh+git` are treated as `ssh`). Use `scp` to accept the scp-like
    * `user@host:path` syntax and `local` for plain file-system paths, both are included by default.
    */
   protocols?: ReadonlyArray<SafeProtocol | 'scp' | 'local'>;
}

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
   const allowed = new Set<string>(protocols ?? [...SAFE_PROTOCOLS, 'scp', 'local']);

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

/**
 * Marks an interpolated template value as a branch / tag / ref name, rejecting anything that
 * isn't valid according to the rules of `git check-ref-format`.
 *
 * ```typescript
 * await git.cmd`checkout -b ${refName(userInput)}`;
 * ```
 */
export function refName(value: string) {
   return new TemplateValue(String(value), (ref) => {
      if (
         !ref ||
         ref === '@' ||
         ref.includes('..') ||
         ref.includes('@{') ||
         ref.includes('//') ||
         /[\s~^:?*[\\]/.test(ref) ||
         ref.endsWith('/') ||
         ref.endsWith('.') ||
         ref.split('/').some((part) => part.startsWith('.') || part.endsWith('.lock'))
      ) {
         return `not a valid ref name`;
      }
      return undefined;
   });
}
