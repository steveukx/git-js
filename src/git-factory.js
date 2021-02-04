const Git = require('./git');
const {GitConstructError} = require('./lib/api');
const {PluginStore} = require("./lib/plugins/plugin-store");
const {commandConfigPrefixingPlugin} = require('./lib/plugins/command-config-prefixing-plugin');
const {createInstanceConfig, folderExists} = require('./lib/utils');

const api = Object.create(null);
for (let imported = require('./lib/api'), keys = Object.keys(imported), i = 0; i < keys.length; i++) {
   const name = keys[i];
   if (/^[A-Z]/.test(name)) {
      api[name] = imported[name];
   }
}

/**
 * Adds the necessary properties to the supplied object to enable it for use as
 * the default export of a module.
 *
 * Eg: `module.exports = esModuleFactory({ something () {} })`
 */
module.exports.esModuleFactory = function esModuleFactory (defaultExport) {
   return Object.defineProperties(defaultExport, {
      __esModule: {value: true},
      default: {value: defaultExport},
   });
}

module.exports.gitExportFactory = function gitExportFactory (factory, extra) {
   return Object.assign(function () {
         return factory.apply(null, arguments);
      },
      api,
      extra || {},
   );
};

module.exports.gitInstanceFactory = function gitInstanceFactory (baseDir, options) {
   const plugins = new PluginStore();
   const config = createInstanceConfig(
      baseDir && (typeof baseDir === 'string' ? {baseDir} : baseDir),
      options
   );

   if (!folderExists(config.baseDir)) {
      throw new GitConstructError(config, `Cannot use simple-git on a directory that does not exist`);
   }

   if (config.config) {
      plugins.add(commandConfigPrefixingPlugin(config.config));
   }

   return new Git(config, plugins);
};
