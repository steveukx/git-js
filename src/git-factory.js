const Git = require('./git');

const api = {
   CleanOptions: require('./lib/tasks/clean').CleanOptions
};

module.exports.gitExportFactory = function gitExportFactory (factory, extra) {
   return Object.assign(function () {
         return factory.apply(null, arguments);
      },
      api,
      extra || {},
   );
};

module.exports.gitInstanceFactory = function gitInstanceFactory (baseDir) {

   const dependencies = require('./util/dependencies');

   if (baseDir && !dependencies.exists(baseDir, dependencies.exists.FOLDER)) {
      throw new Error("Cannot use simple-git on a directory that does not exist.");
   }

   return new Git(baseDir || process.cwd(), dependencies.childProcess(), dependencies.buffer());
};
