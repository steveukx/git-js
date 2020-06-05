import { SimpleGit } from '../../../typings';
import { GitResponseError } from '../errors/git-response-error';
import { SimpleGitTaskCallback } from '../types';

const functionNamesBuilderApi = [
   'customBinary', 'env', 'outputHandler', 'silent',
];

const functionNamesPromiseApi = [
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

const {gitInstanceFactory} = require('../../git-factory');

export function gitP(baseDir?: string): SimpleGit {

   let git: any;

   let chain = Promise.resolve();

   try {
      git = gitInstanceFactory(baseDir);
   } catch (e) {
      chain = Promise.reject(e);
   }

   function builderReturn() {
      return promiseApi;
   }

   function chainReturn() {
      return chain;
   }

   const promiseApi = [...functionNamesBuilderApi, ...functionNamesPromiseApi].reduce((api: any, name: string) => {
      const isAsync = functionNamesPromiseApi.includes(name);

      const valid = isAsync ? asyncWrapper(name, git) : syncWrapper(name, git, api);
      const alternative = isAsync ? chainReturn : builderReturn;

      Object.defineProperty(api, name, {
         enumerable: false,
         configurable: false,
         value: git ? valid : alternative,
      });

      return api;
   }, {});

   return promiseApi as SimpleGit;

   function asyncWrapper(fn: string, git: any): (...args: any[]) => Promise<any> {
      return function (...args: any[]) {
         if (typeof args[args.length] === 'function') {
            throw new TypeError(
               'Promise interface requires that handlers are not supplied inline, ' +
               'trailing function not allowed in call to ' + fn);
         }

         return chain.then(function () {
            return new Promise(function (resolve, reject) {
               const callback: SimpleGitTaskCallback = (err: Error | null, result?: any) => {
                  if (err) {
                     return reject(toError(err));
                  }

                  resolve(result);
               };
               args.push(callback);

               git[fn].apply(git, args);
            });
         });
      };
   }

   function syncWrapper(fn: string, git: any, api: SimpleGit) {
      return (...args: any[]) => {
         git[fn](...args);

         return api;
      };
   }
}

function toError(error: Error | string | any): Error {

   if (error instanceof Error) {
      return error;
   }

   if (typeof error === 'string') {
      return new Error(error);
   }

   return new GitResponseError(error);
}
