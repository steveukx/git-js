import { CleanSummary } from '../../../typings';
import { cleanSummaryParser } from '../responses/CleanSummary';
import { Maybe, StringTask } from '../types';
import { asStringArray } from '../utils';
import { configurationErrorTask } from './task';

export const CONFIG_ERROR_INTERACTIVE_MODE = 'Git clean interactive mode is not supported';
export const CONFIG_ERROR_MODE_REQUIRED = 'Git clean mode parameter ("n" or "f") is required';
export const CONFIG_ERROR_UNKNOWN_OPTION = 'Git clean unknown option found in: ';

/**
 * All supported option switches available for use in a `git.clean` operation
 */
export enum CleanOptions {
   DRY_RUN = 'n',
   FORCE = 'f',
   IGNORED_INCLUDED = 'x',
   IGNORED_ONLY = 'X',
   EXCLUDING = 'e',
   QUIET = 'q',
   RECURSIVE = 'd',
}

/**
 * The two modes `git.clean` can run in - one of these must be supplied in order
 * for the command to not throw a `TaskConfigurationError`
 */
export type CleanMode = CleanOptions.FORCE | CleanOptions.DRY_RUN;

const CleanOptionValues: Set<string> = new Set([
   'i',
   ...asStringArray(Object.values(CleanOptions as any)),
]);

export function cleanWithOptionsTask(mode: CleanMode | string, customArgs: string[]) {
   const { cleanMode, options, valid } = getCleanOptions(mode);

   if (!cleanMode) {
      return configurationErrorTask(CONFIG_ERROR_MODE_REQUIRED);
   }

   if (!valid.options) {
      return configurationErrorTask(CONFIG_ERROR_UNKNOWN_OPTION + JSON.stringify(mode));
   }

   options.push(...customArgs);

   if (options.some(isInteractiveMode)) {
      return configurationErrorTask(CONFIG_ERROR_INTERACTIVE_MODE);
   }

   return cleanTask(cleanMode, options);
}

export function cleanTask(mode: CleanMode, customArgs: string[]): StringTask<CleanSummary> {
   const commands: string[] = ['clean', `-${mode}`, ...customArgs];

   return {
      commands,
      format: 'utf-8',
      parser(text: string): CleanSummary {
         return cleanSummaryParser(mode === CleanOptions.DRY_RUN, text);
      },
   };
}

export function isCleanOptionsArray(input: string[]): input is CleanOptions[] {
   return Array.isArray(input) && input.every((test) => CleanOptionValues.has(test));
}

function getCleanOptions(input: string) {
   let cleanMode: Maybe<CleanMode>;
   let options: string[] = [];
   let valid = { cleanMode: false, options: true };

   input
      .replace(/[^a-z]i/g, '')
      .split('')
      .forEach((char) => {
         if (isCleanMode(char)) {
            cleanMode = char;
            valid.cleanMode = true;
         } else {
            valid.options = valid.options && isKnownOption((options[options.length] = `-${char}`));
         }
      });

   return {
      cleanMode,
      options,
      valid,
   };
}

function isCleanMode(cleanMode?: string): cleanMode is CleanMode {
   return cleanMode === CleanOptions.FORCE || cleanMode === CleanOptions.DRY_RUN;
}

function isKnownOption(option: string): boolean {
   return /^-[a-z]$/i.test(option) && CleanOptionValues.has(option.charAt(1));
}

function isInteractiveMode(option: string): boolean {
   if (/^-[^\-]/.test(option)) {
      return option.indexOf('i') > 0;
   }

   return option === '--interactive';
}
