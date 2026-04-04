import { InternalSwitch } from '../switches/switches.types';
import type { ConfigRead, ConfigScope, ConfigWrite } from '../parse-cli.types';
import { detectConfigAction, toOperation } from './detect-config-action';

function parseAssignment(raw: string | undefined): { key: string; value: string } | null {
   const eq = raw?.indexOf('=') || -1;

   if (!raw || eq < 0) {
      return null;
   }

   return {
      key: raw.slice(0, eq).trim().toLowerCase(),
      value: raw.slice(eq + 1),
   };
}

function detectConfigScope(switches: InternalSwitch[]): ConfigScope {
   for (const { name } of switches) {
      switch (name) {
         case '--global':
            return 'global';
         case '--system':
            return 'system';
         case '--worktree':
            return 'worktree';
         case '--local':
            return 'local';
         case '--file':
         case '-f':
            return 'file';
      }
   }
   return 'local';
}

function detectConfigOverrideScope({ name }: InternalSwitch): ConfigScope | void {
   if (name === '-c' || name === '--config') {
      return 'inline';
   }
   if (name === '--config-env') {
      return 'env';
   }
}

/**
 * Generates the stream of ConfigWrite settings found in the supplied switches,
 * triggered by `-c` and `--config` for inline configuration and `--config-env`
 * to set a config setting based on environment variable.
 */
function* collectWriteSwitches(switches: InternalSwitch[]): Generator<ConfigWrite> {
   for (const switchToken of switches) {
      const scope = detectConfigOverrideScope(switchToken);
      const assignment = scope && parseAssignment(switchToken.value);

      if (assignment) {
         yield {
            ...assignment,
            scope,
         };
      }
   }
}

export function collectConfigAccess(
   task: string | null,
   globalSwitches: InternalSwitch[],
   taskSwitches: InternalSwitch[],
   positionals: string[]
): { configWrites: ConfigWrite[]; configReads: ConfigRead[] } {
   const configWrites: ConfigWrite[] = [
      ...collectWriteSwitches(globalSwitches),
      ...collectWriteSwitches(taskSwitches),
   ];
   const configReads: ConfigRead[] = [];

   if (task !== 'config') {
      return { configWrites, configReads };
   }

   const scope = detectConfigScope(taskSwitches);
   const action = detectConfigAction(taskSwitches, positionals);
   if (action) {
      (action.isWrite ? configWrites : configReads).push(toOperation(scope, action));
   }

   return { configWrites, configReads };
}
