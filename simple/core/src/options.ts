import type { SimpleGitCoreOptions } from './types';

const defaultOptions: Omit<SimpleGitCoreOptions, 'baseDir'> = {
   binary: 'git',
   maxConcurrentProcesses: 5,
   config: [],
   trimmed: false,
   allowEnvironment: [],
   allowConfigWrite: [],
};

export function createInstanceConfig(
   ...options: Array<Partial<SimpleGitCoreOptions> | undefined>
): SimpleGitCoreOptions {
   const baseDir = process.cwd();
   const config: SimpleGitCoreOptions = Object.assign(
      { baseDir, ...defaultOptions },
      ...options.filter((o) => typeof o === 'object' && o)
   );

   config.baseDir = config.baseDir || baseDir;
   config.trimmed = config.trimmed === true;

   return config;
}
