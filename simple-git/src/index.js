const { gitP } = require('./lib/runners/promise-wrapped');
const { esModuleFactory, gitInstanceFactory, gitExportFactory } = require('./lib/git-factory');

const simpleGit = esModuleFactory(gitExportFactory(gitInstanceFactory));

module.exports = Object.assign(simpleGit, { gitP, simpleGit });
