import { allowConfigWriteUser } from '../config/bless-config';
import { commandConfigPrefixingPlugin } from '../plugins/command-config-prefixing-plugin';
import { configWriteGuardPlugin } from '../plugins/config-write-guard-plugin';
import { environmentFilterPlugin } from '../plugins/environment-filter-plugin';
import { PluginStore } from '../plugins/plugin-store';
import type { SimpleGitOptions } from './executor.types';
import { GitExecutor } from './git-executor';

/**
 * Builds a {@link GitExecutor} with the deny-by-default security model wired in.
 * `allowConfigWrite` is seeded with the user-identity preset so the common
 * "set identity then commit" flow works out of the box; everything else stays
 * deny-by-default.
 */
export function createGit(options: Partial<SimpleGitOptions> = {}): GitExecutor {
   const config: SimpleGitOptions = {
      baseDir: process.cwd(),
      binary: 'git',
      config: [],
      allowEnvironment: [],
      allowConfigWrite: [...allowConfigWriteUser],
      ...options,
   };

   const plugins = new PluginStore()
      .add(environmentFilterPlugin(config.allowEnvironment))
      // config-prefixing MUST precede the write guard so the guard vets the
      // caller-injected `-c` flags it produces.
      .add(config.config.length ? commandConfigPrefixingPlugin(config.config) : undefined)
      .add(configWriteGuardPlugin(config.allowConfigWrite));

   return new GitExecutor(config, plugins);
}
