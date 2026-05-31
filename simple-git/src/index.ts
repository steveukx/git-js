import { esModuleFactory, gitExportFactory, gitInstanceFactory } from './lib/git-factory';
import { gitP } from './lib/runners/promise-wrapped';

const simpleGit = esModuleFactory(gitExportFactory(gitInstanceFactory));

export = Object.assign(simpleGit, { gitP, simpleGit });
