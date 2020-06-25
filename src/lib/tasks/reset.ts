import { straightThroughStringTask } from './task';
import { Maybe, OptionFlags, Options } from '../types';

export enum ResetMode {
   MIXED = 'mixed',
   SOFT = 'soft',
   HARD = 'hard',
   MERGE = 'merge',
   KEEP = 'keep',
}

const ResetModes = Array.from(Object.values(ResetMode));

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

export function getResetMode(mode: ResetMode | any): Maybe<ResetMode> {
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

function isValidResetMode(mode: ResetMode | any): mode is ResetMode {
   return ResetModes.includes(mode);
}
