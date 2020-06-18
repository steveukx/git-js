
const {gitP} = require('./lib/runners/promise-wrapped');
const {gitInstanceFactory, gitExportFactory} = require('./git-factory');

module.exports = gitExportFactory(gitInstanceFactory, {gitP});
