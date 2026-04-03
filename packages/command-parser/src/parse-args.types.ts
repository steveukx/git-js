export type Scope = 'global' | 'command';

export interface OptionDescriptor {
   consumesValue?: boolean;
}

export interface OptionSpec {
   short: Record<string, OptionDescriptor>;
   long: Record<string, OptionDescriptor>;
}

export interface ParsedGitSwitch {
   argIndex: number;
   combined: boolean;
   consumesNext: boolean;
   kind: Scope;
   name: string;
   raw: string;
   value?: string;
   valueIndex?: number;
}

export interface ParsedConfigTask {
   action:
      | 'edit'
      | 'get'
      | 'get-color'
      | 'get-colorbool'
      | 'list'
      | 'remove-section'
      | 'rename-section'
      | 'set'
      | 'unset'
      | 'unknown';
   writes: boolean;
}

export interface ParsedLeadingGlobals {
   switches: ParsedGitSwitch[];
   taskIndex: number;
}

export interface ParsedSwitches {
   consumedIndices: Set<number>;
   switches: ParsedGitSwitch[];
}

export interface NormalizedCommandArgs {
   args: string[];
   pathspecs: string[];
   separator: boolean;
}
