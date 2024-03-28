import { SimpleGitFactory } from '../../typings';

import * as api from './api';
import {
   abortPlugin,
   blockUnsafeOperationsPlugin,
   commandConfigPrefixingPlugin,
   completionDetectionPlugin,
   customBinaryPlugin,
   errorDetectionHandler,
   errorDetectionPlugin,
   PluginStore,
   progressMonitorPlugin,
   spawnOptionsPlugin,
   timeoutPlugin,
} from './plugins';
import { suffixPathsPlugin } from './plugins/suffix-paths.plugin';
import { createInstanceConfig, folderExists } from './utils';
import { SimpleGitOptions } from './types';

const Git = require('../git');

/**
 * Adds the necessary properties to the supplied object to enable it for use as
 * the default export of a module.
 *
 * Eg: `module.exports = esModuleFactory({ something () {} })`
 */
export function esModuleFactory<T>(defaultExport: T) {
   return Object.defineProperties(defaultExport, {
      __esModule: { value: true },
      default: { value: defaultExport },
   }) as T & { __esModule: true; default: T };
}

export function gitExportFactory(factory: SimpleGitFactory) {
   return Object.assign(factory.bind(null), api);
}

export function gitInstanceFactory(
   baseDir?: string | Partial<SimpleGitOptions>,
   options?: Partial<SimpleGitOptions>
) {
   const plugins = new PluginStore();
   const config = createInstanceConfig(
      (baseDir && (typeof baseDir === 'string' ? { baseDir } : baseDir)) || {},
      options
   );

   if (!folderExists(config.baseDir)) {
      throw new api.GitConstructError(
         config,
         `Cannot use simple-git on a directory that does not exist`
      );
   }

   if (Array.isArray(config.config)) {
      plugins.add(commandConfigPrefixingPlugin(config.config));
   }

   plugins.add(blockUnsafeOperationsPlugin(config.unsafe));
   plugins.add(suffixPathsPlugin());
   plugins.add(completionDetectionPlugin(config.completion));
   config.abort && plugins.add(abortPlugin(config.abort));
   config.progress && plugins.add(progressMonitorPlugin(config.progress));
   config.timeout && plugins.add(timeoutPlugin(config.timeout));
   config.spawnOptions && plugins.add(spawnOptionsPlugin(config.spawnOptions));

   plugins.add(errorDetectionPlugin(errorDetectionHandler(true)));
   config.errors && plugins.add(errorDetectionPlugin(config.errors));

   customBinaryPlugin(plugins, config.binary, config.unsafe?.allowUnsafeCustomBinary);

   return new Git(config, plugins);
}
