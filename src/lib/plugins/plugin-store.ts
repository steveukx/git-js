import { SimpleGitPlugin, SimpleGitPluginType, SimpleGitPluginTypes } from './simple-git-plugin';
import { asArray } from '../utils';

export class PluginStore {

   private plugins: Set<SimpleGitPlugin<SimpleGitPluginType>> = new Set();

   public add<T extends SimpleGitPluginType>(plugin: SimpleGitPlugin<T> | SimpleGitPlugin<T>[]) {
      const plugins = asArray(plugin);
      plugins.forEach(plugin => this.plugins.add(plugin));

      return () => {
         plugins.forEach(plugin => this.plugins.delete(plugin));
      };
   }

   public exec<T extends SimpleGitPluginType>(type: T, data: SimpleGitPluginTypes[T]['data'], context: SimpleGitPluginTypes[T]['context']): typeof data {
      let output = data;
      const contextual = Object.freeze(Object.create(context));

      for (const plugin of this.plugins) {
         if (plugin.type === type) {
            output = plugin.action(output, contextual);
         }
      }

      return output;
   }

}
