// @ts-expect-error
import Git from '../git';
import type { SimpleGitFactory } from '../typings';
import * as api from './api';
import {
   abortPlugin,
   allowEnvironmentPlugin,
   blockUnsafeOperationsPlugin,
   commandConfigPrefixingPlugin,
   completionDetectionPlugin,
   customBinaryPlugin,
   errorDetectionHandler,
   errorDetectionPlugin,
   PluginStore,
   progressMonitorPlugin,
   spawnOptionsPlugin,
   suffixPathsPlugin,
   timeoutPlugin,
} from './plugins';
import type { SimpleGitOptions } from './types';
import { createInstanceConfig, folderExists } from './utils';

export const simpleGit: SimpleGitFactory = (
   baseDir?: string | Partial<SimpleGitOptions>,
   options?: Partial<SimpleGitOptions>
) => {
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
   plugins.add(completionDetectionPlugin(config.completion));
   config.abort && plugins.add(abortPlugin(config.abort));
   config.progress && plugins.add(progressMonitorPlugin(config.progress));
   config.timeout && plugins.add(timeoutPlugin(config.timeout));
   config.spawnOptions && plugins.add(spawnOptionsPlugin(config.spawnOptions));
   plugins.add(suffixPathsPlugin());

   plugins.add(errorDetectionPlugin(errorDetectionHandler(true)));
   config.errors && plugins.add(errorDetectionPlugin(config.errors));

   customBinaryPlugin(plugins, config.binary, config.unsafe?.allowUnsafeCustomBinary);

   plugins.add(allowEnvironmentPlugin(config.allowEnvironment ?? []));

   return new Git(config, plugins);
};
