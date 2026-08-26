const { esModuleFactory, gitInstanceFactory, gitExportFactory } = require('./lib/git-factory');

const simpleGit = esModuleFactory(gitExportFactory(gitInstanceFactory));

module.exports = Object.assign(simpleGit, { simpleGit });
