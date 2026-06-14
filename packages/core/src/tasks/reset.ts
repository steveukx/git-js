import type {
   Maybe,
   OptionFlags,
   Options,
   TaskOptions,
   VariadicOptions,
} from '../options/options.types';
import { asTaskOptions } from '../options/task-options';
import { stringTask } from '../task/task';
import type { StringTask } from '../task/task.types';

export enum ResetMode {
   MIXED = 'mixed',
   SOFT = 'soft',
   HARD = 'hard',
   MERGE = 'merge',
   KEEP = 'keep',
}

/**
 * The commonly-used flags accepted by `git reset`, surfaced as a typed extension
 * of {@link Options} so callers get completion for the keys they reach for most.
 */
export type ResetOptions = Options &
   OptionFlags<'-q' | '--quiet' | '--no-quiet' | '--pathspec-from-nul'> &
   OptionFlags<'--pathspec-from-file', string>;

const validResetModes: string[] = Object.values(ResetMode);

function isValidResetMode(mode: unknown): mode is ResetMode {
   return typeof mode === 'string' && validResetModes.includes(mode);
}

/**
 * Resolves the reset mode: a recognised {@link ResetMode}, otherwise `SOFT` when
 * a string or nothing was supplied, otherwise `undefined` (the leading argument
 * was actually options).
 */
export function getResetMode(mode: unknown): Maybe<ResetMode> {
   if (isValidResetMode(mode)) {
      return mode;
   }

   return typeof mode === 'string' || mode === undefined ? ResetMode.SOFT : undefined;
}

/**
 * Resets the current HEAD to the given state. The leading argument may be a
 * {@link ResetMode}, or (when it is an array/options object) the first of the
 * trailing options.
 */
export function reset(
   mode?: ResetMode | TaskOptions<ResetOptions>,
   ...options: VariadicOptions<ResetOptions>
): StringTask<string> {
   const commands = ['reset'];
   const resolvedMode = getResetMode(mode);

   if (resolvedMode) {
      commands.push(`--${resolvedMode}`);
   }

   const trailing = resolvedMode ? options : [mode as TaskOptions<ResetOptions>, ...options];
   commands.push(...asTaskOptions(trailing));

   return stringTask(commands);
}
