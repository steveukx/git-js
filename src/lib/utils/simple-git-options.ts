import { SimpleGitOptions } from '../types';

const defaultOptions: Omit<SimpleGitOptions, 'baseDir'> = {
   binary: 'git',
   maxConcurrentProcesses: 5,
   config: [],
};

export function createInstanceConfig(...options: Array<Partial<SimpleGitOptions> | undefined>): SimpleGitOptions {
   const baseDir = process.cwd();
   const config: SimpleGitOptions = Object.assign({baseDir, ...defaultOptions},
      ...(options.filter(o => typeof o === 'object' && o))
   );

   config.baseDir = config.baseDir || baseDir;

   return config;
}
