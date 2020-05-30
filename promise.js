
const {gitExportFactory} = require('./src/git-factory');
const {gitP} = require('./src/lib/runners/promise');

module.exports = gitExportFactory(gitP);
