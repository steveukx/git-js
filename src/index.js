
const {gitP} = require('./lib/runners/promise');
const {gitInstanceFactory, gitExportFactory} = require('./git-factory');

module.exports = gitExportFactory(gitInstanceFactory, {gitP: gitP});
