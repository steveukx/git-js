const {folderExists} = require('./lib/utils');
const Git = require('./git');

const api = Object.create(null);
for (let imported = require('./lib/api'), keys = Object.keys(imported), i = 0; i < keys.length; i++) {
   const name = keys[i];
   if (/^[A-Z]/.test(name)) {
      api[name] = imported[name];
   }
}

module.exports.gitExportFactory = function gitExportFactory (factory, extra) {
   return Object.assign(function () {
         return factory.apply(null, arguments);
      },
      api,
      extra || {},
   );
};

module.exports.gitInstanceFactory = function gitInstanceFactory (baseDir) {

   if (baseDir && !folderExists(baseDir)) {
      throw new Error("Cannot use simple-git on a directory that does not exist.");
   }

   return new Git(baseDir || process.cwd());
};
