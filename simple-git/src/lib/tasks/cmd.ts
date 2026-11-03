import { isPathSpec } from '@simple-git/args-pathspec';

import type { StringTask } from '../types';
import { configurationErrorTask, type EmptyTask, straightThroughStringTask } from './task';

/**
 * Wrapper for an interpolated `git.cmd` value that must pass extra validation before use, see
 * `remoteUrl` and `refName`.
 */
class CmdValue {
   constructor(
      public readonly value: string,
      public readonly validate: (value: string) => string | undefined
   ) {}
}

export type CmdTemplateValue =
   | string
   | number
   | CmdValue
   | ReadonlyArray<string | number | CmdValue>;

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

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the intent
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const TRANSPORT_HELPER = /^[a-z][a-z0-9+.-]*::/i;
const URL_SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;
const SCP_LIKE = /^(?:([^@/]+)@)?([^/:]+):(?!\/\/)/;

/**
 * Marks an interpolated `git.cmd` value as a remote repository url, rejecting anything other
 * than a well-formed url using a safe protocol.
 *
 * ```typescript
 * await git.cmd`clone --depth 1 ${remoteUrl(userInput)} ${pathspec(target)}`;
 * await git.cmd`ls-remote ${remoteUrl(userInput, { protocols: ['https'] })}`;
 * ```
 */
export function remoteUrl(value: string, { protocols }: RemoteUrlOptions = {}) {
   const allowed = new Set<string>(protocols ?? [...SAFE_PROTOCOLS, 'scp', 'local']);

   return new CmdValue(String(value), (url) => {
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
 * Marks an interpolated `git.cmd` value as a branch / tag / ref name, rejecting anything that
 * isn't valid according to the rules of `git check-ref-format`.
 *
 * ```typescript
 * await git.cmd`checkout -b ${refName(userInput)}`;
 * ```
 */
export function refName(value: string) {
   return new CmdValue(String(value), (ref) => {
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

interface TokenPart {
   text: string;
   value?: unknown;
}

class CmdTemplateError extends Error {}

function fail(message: string): never {
   throw new CmdTemplateError(`git.cmd: ${message}`);
}

function isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
   return Array.isArray(strings) && Array.isArray((strings as any).raw) && Object.isFrozen(strings);
}

function describe(value: unknown) {
   return JSON.stringify(String(value));
}

/**
 * Converts a single interpolated value into the string that will be passed to `git`,
 * applying the validation that is common to all values.
 */
function valueToString(value: unknown): string {
   let text: string;

   if (value instanceof CmdValue) {
      text = value.value;
      const problem = value.validate(text);
      if (problem) {
         fail(`interpolated value ${describe(text)} is rejected: ${problem}`);
      }
   } else if (typeof value === 'string') {
      text = value;
   } else if (typeof value === 'number' && Number.isFinite(value)) {
      text = String(value);
   } else {
      fail(
         `interpolated values must be strings, finite numbers or arrays of them, received ${typeof value}`
      );
   }

   if (CONTROL_CHARACTERS.test(text)) {
      fail(`interpolated value ${describe(text)} contains control characters`);
   }

   if (TRANSPORT_HELPER.test(text)) {
      fail(`interpolated value ${describe(text)} would select a git remote helper transport`);
   }

   return text;
}

/**
 * Split the template into tokens, each token is the list of literal and interpolated parts that
 * are joined together without whitespace between them.
 */
function tokenise(strings: TemplateStringsArray, values: readonly unknown[]): TokenPart[][] {
   const tokens: TokenPart[][] = [];
   let current: TokenPart[] = [];

   const flush = () => {
      if (current.length) {
         tokens.push(current);
         current = [];
      }
   };

   strings.forEach((literal, index) => {
      for (const piece of literal.split(/(\s+)/)) {
         if (/^\s+$/.test(piece)) {
            flush();
         } else if (piece) {
            current.push({ text: piece });
         }
      }

      if (index < values.length) {
         current.push({ text: '', value: values[index] });
      }
   });

   flush();
   return tokens;
}

const CONFIG_FLAGS = new Set(['-c', '--config', '--config-env']);

/** Global options that consume the next token as their value. */
const GLOBAL_VALUE_FLAGS = new Set([
   '-C',
   '-c',
   '--attr-source',
   '--config-env',
   '--git-dir',
   '--namespace',
   '--super-prefix',
   '--work-tree',
]);

/**
 * Build the argv for a tagged template, see the `cmd` method in the `SimpleGit` typings for
 * the rules applied.
 */
export function cmdArgv(strings: TemplateStringsArray, values: readonly unknown[]): unknown[] {
   const argv: unknown[] = [];
   let task: string | undefined;
   let afterDoubleDash = false;
   let previousLiteral: string | undefined;

   for (const parts of tokenise(strings, values)) {
      const literalOnly = parts.every((part) => !('value' in part));

      if (literalOnly) {
         const token = parts.map((part) => part.text).join('');
         argv.push(token);
         previousLiteral = token;
         afterDoubleDash ||= task !== undefined && token === '--';
         if (
            task === undefined &&
            !token.startsWith('-') &&
            !GLOBAL_VALUE_FLAGS.has(argv.at(-2) as string)
         ) {
            task = token;
         }
         continue;
      }

      const startsWithLiteral = !('value' in parts[0]);
      const followsConfigFlag = previousLiteral !== undefined && CONFIG_FLAGS.has(previousLiteral);

      if (followsConfigFlag && !startsWithLiteral) {
         fail(
            `configuration keys must be written literally, use "-c some.key=\${value}" rather than "-c \${value}"`
         );
      }

      const isOptionValue =
         startsWithLiteral &&
         (parts[0].text.startsWith('-') ||
            (previousLiteral !== undefined && GLOBAL_VALUE_FLAGS.has(previousLiteral)));

      if (task === undefined && !isOptionValue) {
         fail(
            `the git sub-command must be written literally, interpolated values before it can only be used as option values, for example "-c user.name=\${name}"`
         );
      }

      // a standalone value: `${value}`
      if (parts.length === 1) {
         const { value } = parts[0];

         if (isPathSpec(value)) {
            argv.push(value);
         } else {
            for (const item of Array.isArray(value) ? value : [value]) {
               const text = valueToString(item);
               if (text.startsWith('-') && !afterDoubleDash) {
                  fail(
                     `interpolated value ${describe(text)} would be read as an option, values that may start with "-" must follow "--" or be wrapped with pathspec()`
                  );
               }
               argv.push(text);
            }
         }

         previousLiteral = undefined;
         continue;
      }

      // a value joined to literal text: `--message=${value}`, `origin/${branch}`, `${a}..${b}`
      let token = '';
      let firstValueAt = -1;
      for (const part of parts) {
         if ('value' in part) {
            if (Array.isArray(part.value) || isPathSpec(part.value)) {
               fail(`arrays and pathspecs must be interpolated as a standalone argument`);
            }
            if (firstValueAt < 0) {
               firstValueAt = token.length;
            }
            token += valueToString(part.value);
         } else {
            token += part.text;
         }
      }

      if (firstValueAt === 0 && token.startsWith('-') && !afterDoubleDash) {
         fail(`interpolated value ${describe(token)} would be read as an option`);
      }

      if (firstValueAt > 0 && token.startsWith('-') && !afterDoubleDash) {
         const assignment = token.indexOf('=');
         if (assignment < 0 || assignment >= firstValueAt) {
            fail(
               `interpolated values in options must follow "=", for example "--message=\${value}"`
            );
         }
      }

      if (previousLiteral !== undefined && CONFIG_FLAGS.has(previousLiteral)) {
         const assignment = token.indexOf('=');
         if (assignment < 0 || assignment >= firstValueAt) {
            fail(
               `configuration keys must be written literally, use "-c some.key=\${value}" rather than "-c \${value}"`
            );
         }
      }

      const configPrefix = /^(?:--config(?:-env)?=|-c(?=.))/.exec(token)?.[0];
      if (configPrefix && !afterDoubleDash) {
         const assignment = token.indexOf('=', configPrefix.length);
         if (assignment < 0 || assignment >= firstValueAt) {
            fail(`configuration keys must be written literally, use "--config=some.key=\${value}"`);
         }
      }

      argv.push(token);
      previousLiteral = undefined;
   }

   if (task === undefined) {
      fail(`no git sub-command supplied`);
   }

   return argv;
}

export function cmdTask(
   strings: unknown,
   values: readonly unknown[]
): StringTask<string> | EmptyTask {
   if (!isTemplateStringsArray(strings)) {
      return configurationErrorTask(
         'git.cmd must be used as a tagged template literal, for example git.cmd`status`, use git.raw to supply an array of arguments'
      );
   }

   try {
      return straightThroughStringTask(cmdArgv(strings, values) as string[]);
   } catch (err) {
      if (err instanceof CmdTemplateError) {
         return configurationErrorTask(err.message);
      }
      throw err;
   }
}
