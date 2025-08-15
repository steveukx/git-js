import type { Maybe, OptionFlags, Options } from '../types';
import { asStringArray } from '../utils';
import { straightThroughStringTask } from './task';

export enum ResetMode {
   MIXED = 'mixed',
   SOFT = 'soft',
   HARD = 'hard',
   MERGE = 'merge',
   KEEP = 'keep',
}

const validResetModes = asStringArray(Object.values(ResetMode));

export type ResetOptions = Options &
   OptionFlags<'-q' | '--quiet' | '--no-quiet' | '--pathspec-from-nul'> &
   OptionFlags<'--pathspec-from-file', string>;

export function resetTask(mode: Maybe<ResetMode>, customArgs: string[]) {
   const commands: string[] = ['reset'];
   if (isValidResetMode(mode)) {
      commands.push(`--${mode}`);
   }
   commands.push(...customArgs);

   return straightThroughStringTask(commands);
}

export function getResetMode(mode: ResetMode | unknown): Maybe<ResetMode> {
   if (isValidResetMode(mode)) {
      return mode;
   }

   switch (typeof mode) {
      case 'string':
      case 'undefined':
         return ResetMode.SOFT;
   }

   return;
}

function isValidResetMode(mode: ResetMode | unknown): mode is ResetMode {
   return typeof mode === 'string' && validResetModes.includes(mode);
}
