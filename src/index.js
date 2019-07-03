
var Git = require('./git');

module.exports = function (baseDir) {

   var context = require('./util/context');

   if (baseDir && !context.exists(baseDir, context.exists.FOLDER)) {
       throw new Error("Cannot use simple-git on a directory that does not exist.");
    }

    return new Git(baseDir || process.cwd(), context.childProcess(), context.buffer());
};

