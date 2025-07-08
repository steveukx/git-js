import { EventEmitter } from 'node:events';

import type {
   SimpleGitPlugin,
   SimpleGitPluginType,
   SimpleGitPluginTypes,
} from './simple-git-plugin';
import { append, asArray } from '../utils';
import type { SimpleGitPluginConfig } from '../types';

export class PluginStore {
   private plugins: Set<SimpleGitPlugin<SimpleGitPluginType>> = new Set();
   private events = new EventEmitter();

   on<K extends keyof SimpleGitPluginConfig>(
      type: K,
      listener: (data: SimpleGitPluginConfig[K]) => void
   ) {
      this.events.on(type, listener);
   }

   reconfigure<K extends keyof SimpleGitPluginConfig>(type: K, data: SimpleGitPluginConfig[K]) {
      this.events.emit(type, data);
   }

   public append<T extends SimpleGitPluginType>(type: T, action: SimpleGitPlugin<T>['action']) {
      const plugin = append(this.plugins, { type, action });

      return () => this.plugins.delete(plugin);
   }

   public add<T extends SimpleGitPluginType>(
      plugin: void | SimpleGitPlugin<T> | SimpleGitPlugin<T>[]
   ) {
      const plugins: SimpleGitPlugin<T>[] = [];

      asArray(plugin).forEach((plugin) => plugin && this.plugins.add(append(plugins, plugin)));

      return () => {
         plugins.forEach((plugin) => this.plugins.delete(plugin));
      };
   }

   public exec<T extends SimpleGitPluginType>(
      type: T,
      data: SimpleGitPluginTypes[T]['data'],
      context: SimpleGitPluginTypes[T]['context']
   ): typeof data {
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
