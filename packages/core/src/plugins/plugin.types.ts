import type { SpawnOptions } from 'node:child_process';

/** The shared context every spawn-stage plugin receives. */
export interface SpawnContext {
   /** The git sub-command (first token of the task's commands). */
   method: string;
   /** The command arguments as they stand when the plugin runs. */
   commands: string[];
   /** The environment explicitly supplied via `.env(...)`, if any. */
   env?: NodeJS.ProcessEnv;
}

export interface SpawnOptionsData {
   cwd: string;
   env: NodeJS.ProcessEnv;
   windowsHide: boolean;
}

export interface PluginMap {
   'spawn.binary': { data: string };
   'spawn.args': { data: string[] };
   'spawn.options': { data: SpawnOptionsData & SpawnOptions };
}

export type PluginType = keyof PluginMap;

export interface SimpleGitPlugin<T extends PluginType> {
   type: T;
   action: (data: PluginMap[T]['data'], context: SpawnContext) => PluginMap[T]['data'];
}
