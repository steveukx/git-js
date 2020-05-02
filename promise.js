if (typeof Promise === 'undefined') {
   throw new ReferenceError("Promise wrappers must be enabled to use the promise API");
}

function isAsyncCall (fn) {
   return /^[^)]+then\s*\)/.test(fn) || /\._run\(/.test(fn);
}

var functionNamesBuilderApi = [
   'customBinary', 'env', 'outputHandler', 'silent',
];

var functionNamesPromiseApi = [
   'add',
   'addAnnotatedTag',
   'addConfig',
   'addRemote',
   'addTag',
   'binaryCatFile',
   'branch',
   'branchLocal',
   'catFile',
   'checkIgnore',
   'checkIsRepo',
   'checkout',
   'checkoutBranch',
   'checkoutLatestTag',
   'checkoutLocalBranch',
   'clean',
   'clone',
   'commit',
   'cwd',
   'deleteLocalBranch',
   'deleteLocalBranches',
   'diff',
   'diffSummary',
   'exec',
   'fetch',
   'getRemotes',
   'init',
   'listConfig',
   'listRemote',
   'log',
   'merge',
   'mergeFromTo',
   'mirror',
   'mv',
   'pull',
   'push',
   'pushTags',
   'raw',
   'rebase',
   'remote',
   'removeRemote',
   'reset',
   'revert',
   'revparse',
   'rm',
   'rmKeepLocal',
   'show',
   'stash',
   'stashList',
   'status',
   'subModule',
   'submoduleAdd',
   'submoduleInit',
   'submoduleUpdate',
   'tag',
   'tags',
   'updateServerInfo'
];

module.exports = function (baseDir) {

   var Git = require('./src/git');
   var gitFactory = require('./src');
   var git;


   var chain = Promise.resolve();

   try {
      git = gitFactory(baseDir);
   }
   catch (e) {
      chain = Promise.reject(e);
   }

   var promiseApi = {};


   var builderReturn = function () {
      return promiseApi;
   };
   functionNamesBuilderApi.forEach(function (name) {
      promiseApi[name] = git && syncWrapper(name, git, promiseApi) || builderReturn;
   });

   var chainReturn = function () {
      return chain;
   };
   functionNamesPromiseApi.forEach(function (name) {
      promiseApi[name] = git && asyncWrapper(name, git) || chainReturn;
   });

   return promiseApi;

   function asyncWrapper (fn, git) {
      return function () {
         var args = [].slice.call(arguments);

         if (typeof args[args.length] === 'function') {
            throw new TypeError(
               "Promise interface requires that handlers are not supplied inline, " +
               "trailing function not allowed in call to " + fn);
         }

         return chain.then(function () {
            return new Promise(function (resolve, reject) {
               args.push(function (err, result) {
                  if (err) {
                     return reject(toError(err));
                  }

                  resolve(result);
               });

               git[fn].apply(git, args);
            });
         });
      };
   }

   function syncWrapper (fn, git, api) {
      return function () {
         git[fn].apply(git, arguments);

         return api;
      };
   }

};

function toError (error) {

   if (error instanceof Error) {
      return error;
   }

   if (typeof error === 'string') {
      return new Error(error);
   }

   return Object.create(new Error(error), {
      git: {value: error},
   });
}
