import { type Flag, scopedFlags } from '../flags/flags.helpers';
import type { ConfigScope, ConfigWrite, ParsedConfigActivity } from '../parse-argv.types';
import type { ConfigOperation } from './config.types';
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

function detectConfigScope(flags: Flag[]): ConfigScope {
   for (const { name } of scopedFlags(flags, 'task')) {
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

function detectConfigOverrideScope({ name }: Flag): ConfigScope | void {
   if (name === '-c' || name === '--config') {
      return 'inline';
   }
   if (name === '--config-env') {
      return 'env';
   }
}

/**
 * Generates the stream of ConfigWrite settings found in the supplied flags,
 * triggered by `-c` and `--config` for inline configuration and `--config-env`
 * to set a config setting based on environment variable.
 */
function* collectWriteFlags(flags: Flag[]): Generator<ConfigWrite> {
   for (const flag of flags) {
      const scope = detectConfigOverrideScope(flag);
      const assignment = scope && parseAssignment(flag.value);

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
   flags: Flag[],
   positionals: string[]
): ParsedConfigActivity {
   const parsedConfig: ParsedConfigActivity = {
      read: [],
      write: [...collectWriteFlags(flags)],
   };

   if (task === 'config') {
      appendParsedConfigAction(
         parsedConfig,
         detectConfigScope(flags),
         detectConfigAction(flags, positionals)
      );
   }

   return parsedConfig;
}

function appendParsedConfigAction(
   parsedConfig: ParsedConfigActivity,
   scope: ConfigScope,
   action: ConfigOperation | null
) {
   if (action === null) {
      return;
   }

   const config = toOperation(scope, action);
   if (action.isWrite) {
      parsedConfig.write.push(config);
   } else {
      parsedConfig.read.push(config);
   }
}
