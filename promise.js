
const {esModuleFactory, gitExportFactory} = require('./src/lib/git-factory');
const {gitP} = require('./src/lib/runners/promise-wrapped');

module.exports = esModuleFactory(
   gitExportFactory(gitP)
);
