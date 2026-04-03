import { isPathSpec, toPaths } from './pathspec';
import {
   type NormalizedCommandArgs,
   type OptionDescriptor,
   type OptionSpec,
   type ParsedGitSwitch,
   type ParsedLeadingGlobals,
   type ParsedSwitches,
   type Scope,
} from './parse-args.types';

export const EMPTY_SPEC: OptionSpec = {
   short: {},
   long: {},
};

export const GLOBAL_OPTIONS: OptionSpec = {
   short: {
      C: { consumesValue: true },
      P: {},
      c: { consumesValue: true },
      h: {},
      p: {},
      v: {},
   },
   long: {
      'attr-source': { consumesValue: true },
      bare: {},
      'config-env': { consumesValue: true },
      'exec-path': {},
      'git-dir': { consumesValue: true },
      help: {},
      'html-path': {},
      'icase-pathspecs': {},
      'info-path': {},
      'list-cmds': { consumesValue: true },
      'literal-pathspecs': {},
      'man-path': {},
      namespace: { consumesValue: true },
      'no-advice': {},
      'no-lazy-fetch': {},
      'no-optional-locks': {},
      'no-pager': {},
      'no-replace-objects': {},
      'noglob-pathspecs': {},
      paginate: {},
      'super-prefix': { consumesValue: true },
      version: {},
      'work-tree': { consumesValue: true },
   },
};

export const COMMAND_OPTIONS: Record<string, OptionSpec> = {
   clone: {
      short: {
         b: { consumesValue: true },
         c: { consumesValue: true },
         j: { consumesValue: true },
         o: { consumesValue: true },
         u: { consumesValue: true },
      },
      long: {
         branch: { consumesValue: true },
         config: { consumesValue: true },
         jobs: { consumesValue: true },
         origin: { consumesValue: true },
         'upload-pack': { consumesValue: true },
      },
   },
   commit: {
      short: {
         C: { consumesValue: true },
         F: { consumesValue: true },
         c: { consumesValue: true },
         m: { consumesValue: true },
         t: { consumesValue: true },
      },
      long: {
         file: { consumesValue: true },
         message: { consumesValue: true },
         'reedit-message': { consumesValue: true },
         'reuse-message': { consumesValue: true },
         template: { consumesValue: true },
      },
   },
   config: {
      short: {
         e: {},
         f: { consumesValue: true },
         l: {},
      },
      long: {
         add: {},
         blob: { consumesValue: true },
         comment: { consumesValue: true },
         default: { consumesValue: true },
         edit: {},
         file: { consumesValue: true },
         'fixed-value': {},
         get: {},
         'get-all': {},
         'get-color': {},
         'get-colorbool': {},
         'get-regexp': {},
         'get-urlmatch': {},
         global: {},
         includes: {},
         list: {},
         local: {},
         'name-only': {},
         null: {},
         'remove-section': {},
         'rename-section': {},
         'replace-all': {},
         show: {},
         'show-origin': {},
         'show-scope': {},
         system: {},
         type: { consumesValue: true },
         unset: {},
         'unset-all': {},
         value: { consumesValue: true },
         worktree: {},
      },
   },
   fetch: {
      short: {},
      long: {
         'upload-pack': { consumesValue: true },
      },
   },
   pull: {
      short: {},
      long: {
         'upload-pack': { consumesValue: true },
      },
   },
   push: {
      short: {},
      long: {
         exec: { consumesValue: true },
         'receive-pack': { consumesValue: true },
      },
   },
};

export function parseLeadingGlobals(input: readonly unknown[]): ParsedLeadingGlobals {
   const switches: ParsedGitSwitch[] = [];
   let taskIndex = input.length;

   for (let index = 0; index < input.length; index++) {
      const current = input[index];

      if (!isSwitchToken(current)) {
         taskIndex = index;
         break;
      }

      const parsed = parseSwitchToken(asString(current), 'global', GLOBAL_OPTIONS, index);
      let nextValueIndex = index + 1;

      for (const switchArg of parsed.switches) {
         if (switchArg.consumesNext && switchArg.value == null && nextValueIndex < input.length) {
            switchArg.value = asString(input[nextValueIndex]);
            switchArg.valueIndex = nextValueIndex;
            nextValueIndex++;
         }

         switches.push(switchArg);
      }

      index = nextValueIndex - 1;
   }

   return { switches, taskIndex };
}

export function collectSwitches(
   input: readonly unknown[],
   kind: Scope,
   spec: OptionSpec,
   indexOffset: number
): ParsedSwitches {
   const consumedIndices = new Set<number>();
   const switches: ParsedGitSwitch[] = [];

   for (let index = 0; index < input.length; index++) {
      if (consumedIndices.has(index)) {
         continue;
      }

      const current = input[index];
      if (!isSwitchToken(current)) {
         continue;
      }

      const value = asString(current);
      if (value === '--') {
         break;
      }

      const parsed = parseSwitchToken(value, kind, spec, indexOffset + index);
      let nextValueIndex = index + 1;

      for (const switchArg of parsed.switches) {
         if (switchArg.consumesNext && switchArg.value == null && nextValueIndex < input.length) {
            switchArg.value = asString(input[nextValueIndex]);
            switchArg.valueIndex = indexOffset + nextValueIndex;
            consumedIndices.add(nextValueIndex);
            nextValueIndex++;
         }

         switches.push(switchArg);
      }
   }

   return { consumedIndices, switches };
}

export function normalizeCommandArgs(
   input: readonly unknown[],
   consumedIndices: ReadonlySet<number>
): NormalizedCommandArgs {
   const args: string[] = [];
   const pathspecs: string[] = [];
   let separator = false;

   for (let index = 0; index < input.length; index++) {
      const current = input[index];

      if (isPathSpec(current)) {
         pathspecs.push(...toPaths(current));
         continue;
      }

      const value = asString(current);
      if (value === '--' && !consumedIndices.has(index)) {
         separator = true;
         for (const suffix of input.slice(index + 1)) {
            if (isPathSpec(suffix)) {
               pathspecs.push(...toPaths(suffix));
               continue;
            }

            pathspecs.push(asString(suffix));
         }
         break;
      }

      args.push(value);
   }

   if (separator || pathspecs.length) {
      args.push('--', ...pathspecs);
   }

   return { args, pathspecs, separator };
}

export function isSwitchToken(value: unknown): value is string {
   return typeof value === 'string' && value.length > 1 && value.startsWith('-');
}

export function asString(value: unknown) {
   return String(value);
}

function parseSwitchToken(raw: string, kind: Scope, spec: OptionSpec, argIndex: number) {
   if (raw.startsWith('--')) {
      const parsed = parseLongSwitch(raw, kind, spec, argIndex);
      return {
         consumedCount: Number(parsed.consumesNext && parsed.value == null),
         switches: [parsed],
      };
   }

   if (raw.length <= 2) {
      const parsed = parseShortSwitch(raw, kind, false, spec.short[raw.charAt(1)], argIndex);
      return {
         consumedCount: Number(parsed.consumesNext && parsed.value == null),
         switches: [parsed],
      };
   }

   const expanded = expandShortSwitches(raw, kind, spec, argIndex);
   return {
      consumedCount: expanded.reduce(
         (count, item) => count + Number(item.consumesNext && item.value == null),
         0
      ),
      switches: expanded,
   };
}

function expandShortSwitches(raw: string, kind: Scope, spec: OptionSpec, argIndex: number) {
   const chars = raw.slice(1).split('');
   const expanded: ParsedGitSwitch[] = [];

   for (let index = 0; index < chars.length; index++) {
      const key = chars[index];
      const descriptor = spec.short[key];
      const remainder = chars.slice(index + 1).join('');

      if (!descriptor) {
         return [
            {
               argIndex,
               combined: false,
               consumesNext: false,
               kind,
               name: raw,
               raw,
            },
         ];
      }

      if (descriptor.consumesValue && remainder && !isKnownShortCluster(remainder, spec)) {
         expanded.push({
            argIndex,
            combined: true,
            consumesNext: false,
            kind,
            name: `-${key}`,
            raw,
            value: remainder,
         });
         return expanded;
      }

      expanded.push(parseShortSwitch(`-${key}`, kind, true, descriptor, argIndex));
   }

   return expanded;
}

function parseLongSwitch(
   raw: string,
   kind: Scope,
   spec: OptionSpec,
   argIndex: number
): ParsedGitSwitch {
   const separator = raw.indexOf('=');
   const name = separator > -1 ? raw.slice(0, separator) : raw;
   const value = separator > -1 ? raw.slice(separator + 1) : undefined;
   const descriptor = spec.long[name.slice(2)];

   return {
      argIndex,
      combined: false,
      consumesNext: Boolean(descriptor?.consumesValue && value == null),
      kind,
      name,
      raw,
      value,
   };
}

function parseShortSwitch(
   name: string,
   kind: Scope,
   combined: boolean,
   descriptor: OptionDescriptor | undefined,
   argIndex: number
): ParsedGitSwitch {
   return {
      argIndex,
      combined,
      consumesNext: Boolean(descriptor?.consumesValue),
      kind,
      name,
      raw: name,
   };
}

function isKnownShortCluster(value: string, spec: OptionSpec) {
   return value.split('').every((char) => Object.hasOwn(spec.short, char));
}
