import type { PluginMap, PluginType, SimpleGitPlugin, SpawnContext } from './plugin.types';

/**
 * An ordered registry of spawn-stage plugins. `exec` runs every plugin of the
 * requested type in registration order, threading each plugin's output into the
 * next — so registration order is significant (e.g. the config-write guard must
 * be registered after the config-prefixing plugin to see its injected flags).
 */
export class PluginStore {
   private readonly plugins: SimpleGitPlugin<PluginType>[] = [];

   add<T extends PluginType>(plugin: SimpleGitPlugin<T> | undefined): this {
      if (plugin) {
         this.plugins.push(plugin as SimpleGitPlugin<PluginType>);
      }
      return this;
   }

   exec<T extends PluginType>(
      type: T,
      data: PluginMap[T]['data'],
      context: SpawnContext
   ): PluginMap[T]['data'] {
      let output = data;

      for (const plugin of this.plugins) {
         if (plugin.type === type) {
            output = (plugin as SimpleGitPlugin<T>).action(output, context);
         }
      }

      return output;
   }
}
