import { isPathSpec } from '@simple-git/args-pathspec';

import { GLOBAL } from '../tokens/flag-specs';
import { TemplateValue } from './template-values';

/**
 * Thrown by `templateArgv` when the template can't be safely converted to an argv.
 */
export class TemplateArgvError extends Error {}

interface TokenPart {
   text: string;
   value?: unknown;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the intent
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const TRANSPORT_HELPER = /^[a-z][a-z0-9+.-]*::/i;

const CONFIG_FLAGS = new Set(['-c', '--config', '--config-env']);

/** Global options that consume the next token as their value. */
const GLOBAL_VALUE_FLAGS = new Set([
   ...[...GLOBAL.short].filter(([, consumesNext]) => consumesNext).map(([char]) => `-${char}`),
   ...[...GLOBAL.long].map((stem) => `--${stem}`),
]);

function fail(message: string): never {
   throw new TemplateArgvError(message);
}

/**
 * Whether the supplied `strings` were created by the JavaScript runtime for a tagged template
 * literal, rather than (for example) an array read from untrusted data.
 */
export function isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
   return (
      Array.isArray(strings) &&
      Array.isArray((strings as { raw?: unknown }).raw) &&
      Object.isFrozen(strings)
   );
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

   if (value instanceof TemplateValue) {
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

/**
 * Build the argv for a tagged template literal. The literal text is trusted and split on
 * whitespace, every interpolated value is treated as untrusted data:
 *
 * - each value becomes exactly one argument (arrays become one argument per item)
 * - the git sub-command must be written literally
 * - a value can't start an argument with `-` unless it follows a literal `--` or is a pathspec
 * - configuration keys must be written literally (`-c key=${value}`, not `-c ${setting}`)
 * - values selecting a remote helper transport (`ext::...`) are always rejected
 *
 * Throws a `TemplateArgvError` when any rule is broken. Pathspec values are returned as-is so
 * the caller can move them after `--`.
 */
export function templateArgv(strings: TemplateStringsArray, values: readonly unknown[]): unknown[] {
   if (!isTemplateStringsArray(strings)) {
      fail(`must be used as a tagged template literal`);
   }

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
