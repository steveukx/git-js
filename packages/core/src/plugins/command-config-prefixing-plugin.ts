import type { SimpleGitPlugin } from './plugin.types';

/**
 * Prefixes caller-supplied `config` entries onto every command as `-c key=value`
 * flags. These are deliberately *not* blessed: they originate from the caller, so
 * the config-write guard (registered after this plugin) still vets them.
 */
export function commandConfigPrefixingPlugin(
   configuration: string[]
): SimpleGitPlugin<'spawn.args'> {
   const prefix = configuration.flatMap((entry) => ['-c', entry]);

   return {
      type: 'spawn.args',
      action(args) {
         return [...prefix, ...args];
      },
   };
}
