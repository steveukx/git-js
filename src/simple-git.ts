import {
   appendOptions,
   appendOptionsFromArguments,
   flatten,
   trailingArrayArgument,
   trailingFunctionArgument
} from './util/argument-helpers';
import { debug } from './util/debug';
import { deferred } from './util/deferred';

// v1 typings
import { DefaultLogFields, RemoteWithRefs } from '../typings/response';
import { LogOptions } from '../promise';
import dependencies from './util/dependencies';
import { BranchDeletion, BranchSummary, TagList } from './responses';


// TODO - imports all responses / parsers so isn't fully tree-shakeable
const responses = require('./responses');


export interface EnvironmentMap {
   [key: string]: string;
}

export interface OutputHandlerFn {
   (command: string, stdout: any, stderr: any): void;
}

export interface ResponseHandlerFn<R = string, E = Error> {
   (error: PotentialError<E>, response: R | undefined): void;
}

export interface RunOptionsOnError {
   (
      exitCode: number,
      stdErr: any,
      done: (output?: any) => void,
      fail: (error?: any) => void,
   ): void;
}

export interface RunOptions {
   concatStdErr?: boolean;
   format?: 'utf-8' | 'buffer',
   onError?: RunOptionsOnError;
}

export type RunCacheItem = [string[], ResponseHandlerFn, RunOptions]

export type Options = { [key: string]: null | string | string[] | any };

export type OptionsArray = string[];

export type CleanMode = 'd' | 'f' | 'i' | 'n' | 'q' | 'x' | 'X';

export type DeleteBranchOptionsArray = Array<'-d' | '-D' | '--delete' | string>;
export type DeleteBranchOptionsObject = Options & {'-d': string[]};
export type DeleteBranchOptions = DeleteBranchOptionsObject | DeleteBranchOptionsArray;

export type StringOrStrings = string | string[];

export type LogType = 'log' | 'warn' | 'error';

export type PotentialError<E = Error> = E | null;

/**
 * Requires and returns a response handler based on its named type
 */
const requireResponseHandler = (type: string) => responses[type];

export class SimpleGit {

   /**
    * The command to use to reference the git binary
    */
   private _command = 'git';

   /**
    * An object of key=value pairs to be passed as environment variables to the
    *                               spawned child process.
    */
   private _env: EnvironmentMap | null = null;

   /**
    * An optional handler to use when a child process is created
    */
   private _outputHandler: OutputHandlerFn | null = null;

   /**
    * Property showing whether logging will be silenced - defaults to true in a production environment
    */
   private _silentLogging: boolean = /prod/.test(String(process.env.NODE_ENV));

   private _runCache: RunCacheItem[] = [];

   private _childProcess: any;

   /**
    * Git handling for node. All public functions can be chained and all `then` handlers are optional.
    */
   constructor(
      private _baseDir: string,
   ) {
   }

   /**
    * Adds one or more files to source control
    */
   add(files: StringOrStrings, then?: ResponseHandlerFn): SimpleGit {
      return this._run(flatten('add', files), this._responseHandler(then));
   }

   /**
    * Add an annotated tag to the head of the current branch
    */
   addAnnotatedTag(tagName: string, tagMessage: string, then: ResponseHandlerFn): SimpleGit {
      return this.tag(['-a', '-m', tagMessage, tagName], then);
   }

   /**
    * Add config to local git instance
    */
   addConfig(key: string, value: string, then: ResponseHandlerFn): SimpleGit {
      return this._run(
         ['config', '--local', key, value],
         this._responseHandler(then),
      );
   }

   /**
    * Adds a remote to the list of remotes.
    */
   addRemote(remoteName: string, remoteRepo: string, then: ResponseHandlerFn) {
      return this._run(['remote', 'add', remoteName, remoteRepo], this._responseHandler(then));
   }

   /**
    * Add a lightweight tag to the head of the current branch
    */
   addTag(name: string, then: ResponseHandlerFn): SimpleGit {
      return this.tag([name], then);
   }

   /**
    * Equivalent to `catFile` but will return the native `Buffer` of content from the git command's stdout.
    */
   binaryCatFile(options?: string[], then?: ResponseHandlerFn<any>) {
      return this._run(
         appendOptionsFromArguments(['cat-file'], arguments),
         trailingFunctionArgument(arguments),
         { format: 'buffer' },
      );
   }

   /**
    * List all branches
    */
   public branch (options: Options | OptionsArray): SimpleGit;
   public branch (then: ResponseHandlerFn<BranchSummary>): SimpleGit;
   public branch (options: Options | OptionsArray, then?: ResponseHandlerFn<BranchSummary>): SimpleGit;
   public branch (options: DeleteBranchOptions, then?: ResponseHandlerFn<BranchDeletion[]>): SimpleGit;
   public branch(): SimpleGit {
      const next = trailingFunctionArgument(arguments);
      const command = appendOptionsFromArguments(['branch'], arguments);

      if (!arguments.length) { // TODO: support (then) call signature || next === options) {
         command.push('-a');
      }

      // TODO: the other flags need to be added to the DeleteBranchOptions type
      const isDelete = ['-d', '-D', '--delete'].some((flag) => command.indexOf(flag) > 0);

      if (command.indexOf('-v') < 0) {
         command.splice(1, 0, '-v');
      }

      const responseHandler = isDelete
         ? this._responseHandler(next, 'branchDeleteParser')
         : this._responseHandler(next, 'branchSummaryParser');

      return this._run(command, responseHandler);
   }

   /**
    * Return list of local branches
    */
   branchLocal(then?: ResponseHandlerFn<BranchSummary>): SimpleGit {
      return this.branch([], then);
   }

   /**
    * Returns a list of objects in a tree based on commit hash. Passing in an object hash returns the object's content,
    * size, and type.
    *
    * Passing "-p" will instruct cat-file to determine the object type, and display its formatted contents.
    */
   public catFile(options: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit;
   public catFile(then: ResponseHandlerFn): SimpleGit;
   public catFile(): SimpleGit {
      return this._run(
         appendOptionsFromArguments(['cat-file'], arguments),
         trailingFunctionArgument(arguments),
         { format: 'utf-8' },
      );
   }

   /**
    * Check if a pathname or pathnames are excluded by .gitignore
    */
   checkIgnore(pathnames: StringOrStrings, then: ResponseHandlerFn) {
      return this._run(
         ['check-ignore', ...flatten(pathnames)],
         this._responseHandler(trailingFunctionArgument(arguments), 'checkIgnoreParser'),
      );
   }

   /**
    * Validates that the current repo is a Git repo.
    */
   checkIsRepo(then: ResponseHandlerFn<boolean>) {
      const onError: RunOptionsOnError = (exitCode: number, stdErr: any, done, fail) => {
         // TODO: /\.git/.test()
         if (exitCode === 128 && /(Not a git repository|Kein Git-Repository)/i.test(stdErr)) {
            return done(false);
         }

         fail(stdErr);
      };

      function handler(err: PotentialError, isRepo?: string) {
         // TODO: debugger
         then && then(err, !err && String(isRepo).trim() === 'true');
      }

      return this._run(['rev-parse', '--is-inside-work-tree'], handler, {onError: onError});
   };

   /**
    * Check out a tag or revision, any number of additional arguments can be passed to the `git checkout` command
    * by supplying either a string or array of strings as the `what` parameter.
    */
   checkout(what: StringOrStrings, then: ResponseHandlerFn): SimpleGit {
      return this._run(flatten('checkout', what), this._responseHandler(then));
   }

   /**
    * Check out a remote branch
    */
   checkoutBranch(branchName: string, startPoint: string, then: ResponseHandlerFn): SimpleGit {
      return this.checkout(['-b', branchName, startPoint], then);
   }

   /**
    * Check out a local branch
    */
   checkoutLocalBranch(branchName: string, then: ResponseHandlerFn): SimpleGit {
      return this.checkout(['-b', branchName], then);
   }

   /**
    * Sets the path to a custom git binary, should either be `git` when there is an installation of git available on
    * the system path, or a fully qualified path to the executable.
    */
   customBinary(command: string): SimpleGit {
      this._command = command;
      return this;
   }

   /**
    *
    */
   clean(mode: CleanMode | string, then: ResponseHandlerFn): SimpleGit;
   clean(mode: CleanMode | string, options: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit;
   clean(mode: CleanMode | string) {
      const handler = trailingFunctionArgument(arguments);

      if (!/[nf]/.test(mode)) {
         return this.exec(function () {
            handler && handler(new TypeError('Git clean mode parameter ("n" or "f") is required'));
         });
      }

      if (/[^dfinqxX]/.test(mode)) {
         return this._fail(new TypeError(`Git clean unknown option found in "${ mode }"`), handler);
      }

      const command = appendOptionsFromArguments(['clean', `-${ mode }`], arguments);

      if (command.some(interactiveMode)) {
         return this._fail(new TypeError('Git clean interactive mode is not supported'), handler);
      }

      return this._run(command, this._responseHandler(handler));

      function interactiveMode(option: string) {
         if (/^-[^\-]/.test(option)) {
            return option.indexOf('i') > 0;
         }

         return option === '--interactive';
      }
   }

   /**
    * Clears the queue of pending commands and returns the wrapper instance for chaining.
    */
   clearQueue(): SimpleGit {
      this._runCache.length = 0;
      return this;
   }

   /**
    * Clone a git repo
    */
   clone(repoPath: string, localPath: string, options?: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit;
   clone(repoPath: string, localPath: string, then?: ResponseHandlerFn): SimpleGit;
   clone(repoPath: string, options?: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit;
   clone(repoPath: string, then: ResponseHandlerFn): SimpleGit;
   clone(repoPath: string): SimpleGit {
      const command = appendOptionsFromArguments(['clone'], arguments);

      for (let i = 0, iMax = arguments.length; i < iMax; i++) {
         if (typeof arguments[i] === 'string') {
            command.push(arguments[i]);
         }
      }

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Commits changes in the current working directory - when specific file paths are supplied, only changes on those
    * files will be committed.
    */
   commit(message: StringOrStrings, files: StringOrStrings, options: Options | OptionsArray, then: ResponseHandlerFn) {
      const command = ['commit'];

      flatten(message).forEach(function (message) {
         command.push('-m', message);
      });

      command.push(...flatten(files));

      appendOptionsFromArguments(command, arguments);

      return this._run(
         command,
         this._responseHandler(trailingFunctionArgument(arguments), 'CommitSummary')
      );
   }

   /**
    * Sets the working directory of the subsequent commands.
    */
   cwd(workingDirectory: string, then?: ResponseHandlerFn): SimpleGit {
      const next = trailingFunctionArgument(arguments);

      return this.exec(() => {
         this._baseDir = workingDirectory;
         if (!dependencies.isValidDirectory(workingDirectory)) {
            this._fail(`Git.cwd: cannot change to non-directory "${workingDirectory}"`, next);
         }
         else {
            next && next(null, workingDirectory);
         }
      });
   }


   /**
    * Delete a one or more local branches
    */
   public deleteLocalBranch(branchName: string[], then?: ResponseHandlerFn<BranchDeletion[]>): SimpleGit;
   public deleteLocalBranch(branchName: string, then?: ResponseHandlerFn<BranchDeletion>): SimpleGit;
   public deleteLocalBranch(branchName: string | string[]): SimpleGit {
      const then = trailingFunctionArgument(arguments);

      if (typeof then !== 'function') {
         return this.branch(['-d', ...flatten(branchName)]);
      }

      return this.branch(['-d', ...flatten(branchName)], (err: PotentialError, deletions?: BranchDeletion[]) => {
         if (err || !deletions) {
            return then(err, undefined);
         }

         then(err, Array.isArray(branchName) ? deletions : deletions.pop());
      });
   }

   /**
    * Return repository changes.
    */
   diff(options?: Options | OptionsArray, then?: ResponseHandlerFn) {
      return this._run(
         appendOptionsFromArguments(['diff'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments)),
      );
   }

   diffSummary(options?: Options | OptionsArray, then?: ResponseHandlerFn) {
      return this._run(
         appendOptionsFromArguments(['diff', '--stat=4096'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments), 'DiffSummary'),
      );
   }

   /**
    * Sets an environment variable for the spawned child process, either supply both a name and value as strings or
    * a single object to entirely replace the current environment variables.
    */
   env(name: string | EnvironmentMap, value?: string): SimpleGit {
      if (typeof name === 'string' && typeof value === 'string') {
         (this._env = this._env || {})[name] = value;
      }
      else if (typeof name === 'object') {
         this._env = name;
      }

      return this;
   }

   /**
    * Call a simple function at the next step in the chain.
    * @param {Function} [then]
    */
   exec(then?: Function) {
      this._run([], function () {
         typeof then === 'function' && then();
      });
      return this;
   }

   /**
    * Fetch the updated contents of the current repo.
    *
    * TODO:: docs for:
    * TODO:: (remote, branch, options, then) / (remote, branch, then)
    * TODO:: (options, then) / (then)
    *
    * @example
    *   .fetch('upstream', 'master') // fetches from master on remote named upstream
    *   .fetch(function () {}) // runs fetch against default remote and branch and calls function
    *
    */
   fetch(remote: string, branch: string, options: Options, then: ResponseHandlerFn) {
      const command = appendOptions(['fetch'], arguments);

      if (typeof remote === 'string' && typeof branch === 'string') {
         command.push(remote, branch);
      }

      if (Array.isArray(remote)) {
         command.push(...remote);
      }

      return this._run(
         command,
         this._responseHandler(trailingFunctionArgument(arguments), 'FetchSummary'),
         {
            concatStdErr: true
         }
      );
   }

   // getRemotes (verbose: false, then: ResponseHandlerFn<string>): SimpleGit;
   // getRemotes (verbose: true, then: ResponseHandlerFn<boolean>): SimpleGit;

   /**
    * Gets the currently available remotes, setting the optional verbose argument to true includes additional
    * detail on the remotes themselves.
    */
   getRemotes(verbose = false, then: ResponseHandlerFn<RemoteWithRefs[]>) {
      const commands = verbose === true ? ['-v'] : [];
      const next = trailingFunctionArgument(arguments);

      if (!next) {
         return this.remote(commands, next);
      }

      const handler = (err: PotentialError, data: string | undefined): void => {
         if (err || !data) {
            return next(err);
         }

         const remotes: RemoteWithRefs[] = [];
         const remotesByName: { [name: string]: RemoteWithRefs } = {};

         const remoteForName = (name: string): RemoteWithRefs => {
            if (!remotesByName.hasOwnProperty(name)) {
               remotesByName[name] = remotes[remotes.length] = {
                  name,
                  refs: {
                     fetch: '',
                     push: '',
                  },
               }
            }

            return remotesByName[name];
         };

         data.trim().split('\n').filter(Boolean).forEach(remote => {
            const detail: string[] = remote.trim().split(/\s+/);
            const name: string = String(detail.shift());
            const remoteWithRefs: RemoteWithRefs = remoteForName(name);

            if (detail.length > 0) {
               remoteWithRefs.refs[(String(detail.pop()).replace(/[^a-z]/g, '') as 'fetch' | 'push')] = String(detail.pop());
            }
         });

         next(err, remotes);
      };

      return this.remote(commands, handler);
   }

   /**
    * Initialize a git repo
    */
   init(bare = false, then?: ResponseHandlerFn): SimpleGit {
      const commands = ['init'];
      const next = trailingFunctionArgument(arguments);

      if (bare === true) {
         commands.push('--bare');
      }

      return this._run(commands, function (err) {
         next && next(err);
      });
   }

   /**
    * List remote
    */
   listRemote(args: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {
      return this._run(
         appendOptionsFromArguments(['ls-remote'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments))
      );
   }

   /**
    * Show commit logs from `HEAD` to the first commit.
    * If provided between `options.from` and `options.to` tags or branch.
    *
    * Additionally you can provide options.file, which is the path to a file in your repository. Then only this file will be considered.
    *
    * To use a custom splitter in the log format, set `options.splitter` to be the string the log should be split on.
    *
    * Options can also be supplied as a standard options object for adding custom properties supported by the git log command.
    * For any other set of options, supply options as an array of strings to be appended to the git log command.
    *
    * @param {Object|string[]} [options]
    * @param {string} [options.from] The first commit to include
    * @param {string} [options.to] The most recent commit to include
    * @param {string} [options.file] A single file to include in the result
    * @param {boolean} [options.multiLine] Optionally include multi-line commit messages
    *
    * @param {Function} [then]
    */
   log<T = DefaultLogFields>(options: LogOptions<T> = {}, then: ResponseHandlerFn) {
      const {SPLITTER, START_BOUNDARY, COMMIT_BOUNDARY} = requireResponseHandler('ListLogSummary');
      const handler = trailingFunctionArgument(arguments);
      const opt: LogOptions<T> = (handler === then ? options : null) || {};

      const splitter = opt.splitter || SPLITTER;
      const format = opt.format || {
         hash: '%H',
         date: '%ai',
         message: '%s',
         refs: '%D',
         body: opt.multiLine ? '%B' : '%b',
         author_name: '%aN',
         author_email: '%ae'
      };
      const rangeOperator = (opt.symmetric !== false) ? '...' : '..';

      const fieldNames: string[] = Object.keys(format);
      const formatStr = fieldNames.map(k => String((format as any)[k])).join(splitter);

      const suffix = [];
      const command = [
         'log',
         `--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`,
         ...trailingArrayArgument(arguments)
      ];

      if (opt.n || opt['max-count']) {
         command.push(`--max-count=${ opt.n || opt['max-count'] }`);
      }

      if (opt.from && opt.to) {
         command.push(opt.from + rangeOperator + opt.to);
      }

      if (opt.file) {
         suffix.push('--follow', options.file);
      }

      'splitter n max-count file from to --pretty format symmetric multiLine'.split(' ')
         .forEach(key => delete opt[key]);

      appendOptions(command, opt);

      return this._run(
         command.concat(suffix),
         this._responseHandler(handler, 'ListLogSummary', [splitter, fieldNames])
      );
   };


   /**
    * Runs a merge, `options` can be either an array of arguments
    * supported by the [`git merge`](https://git-scm.com/docs/git-merge)
    * or an options object.
    *
    * Conflicts during the merge result in an error response,
    * the response type whether it was an error or success will be a MergeSummary instance.
    * When successful, the MergeSummary has all detail from a the PullSummary
    *
    * @see ./responses/MergeSummary.js
    * @see ./responses/PullSummary.js
    */
   merge(options: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {
      const userHandler = trailingFunctionArgument(arguments);

      const mergeHandler = (err: PotentialError, mergeSummary: any /* MergeSummary */) => {
         if (!err && mergeSummary.failed) {
            return this._fail(mergeSummary, userHandler);
         }

         userHandler && userHandler(err, mergeSummary);
      };

      const command = appendOptionsFromArguments([], arguments);

      if (command[0] !== 'merge') {
         command.unshift('merge');
      }

      // TODO:
      //
      // if (command.length === 1) {
      //    return this.exec(function () {
      //       then && then(new TypeError('Git.merge requires at least one option'));
      //    });
      // }

      return this._run(
         command,
         this._responseHandler(mergeHandler, 'MergeSummary'),
         {
            concatStdErr: true
         },
      );
   }

   /**
    * Merges from one branch to another, equivalent to running `git merge ${from} $[to}`, the `options` argument can
    * either be an array of additional parameters to pass to the command or null / omitted to be ignored.
    */
   mergeFromTo(from: string, to: string, options: Options | OptionsArray, then: ResponseHandlerFn) {
      return this.merge(
         appendOptionsFromArguments([from, to], arguments),
         trailingFunctionArgument(arguments)
      );
   }

   /**
    * Mirror a git repo
    */
   mirror(repoPath: string, localPath: string, then?: ResponseHandlerFn): SimpleGit {
      return this.clone(repoPath, localPath, ['--mirror'], then);
   }

   /**
    * Moves one or more files to a new destination.
    *
    * @see https://git-scm.com/docs/git-mv
    *
    * @param {string|string[]} from
    * @param {string} to
    * @param {Function} [then]
    */
   mv(from: string | string[], to: string, then?: ResponseHandlerFn): SimpleGit {
      return this._run(
         ['mv', '-v', ...flatten(from), to],
         this._responseHandler(trailingFunctionArgument(arguments), 'MoveSummary')
      );
   }

   /**
    * Sets a handler function to be called whenever a new child process is created, the handler function will be called
    * with the name of the command being run and the stdout & stderr streams used by the ChildProcess.
    *
    * @see http://nodejs.org/api/child_process.html#child_process_class_childprocess
    * @see http://nodejs.org/api/stream.html#stream_class_stream_readable
    */
   outputHandler(outputHandler: OutputHandlerFn): SimpleGit {
      this._outputHandler = outputHandler;
      return this;
   }

   /**
    * Pull the updated contents of the current repo
    *
    * TODO: Add doc for pull(options, then)
    *
    * @param {string} [remote] When supplied must also include the branch
    * @param {string} [branch] When supplied must also include the remote
    * @param {Object} [options] Optionally include set of options to merge into the command
    * @param {Function} [then]
    */
   pull(remote?: string, branch?: string, options?: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit {
      const command = ['pull'];
      if (typeof remote === 'string' && typeof branch === 'string') {
         command.push(remote, branch);
      }

      appendOptionsFromArguments(command, arguments);

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments), 'PullSummary'));
   }

   /**
    * Pushes the current committed changes to a remote, optionally specify the names of the remote and branch to use
    * when pushing. Supply multiple options as an array of strings in the first argument - see examples below.
    */
   push(remote: StringOrStrings, branch?: string, then?: ResponseHandlerFn): SimpleGit {
      const command = [];

      if (typeof remote === 'string' && typeof branch === 'string') {
         command.push(remote, branch);
      }

      if (Array.isArray(remote)) {
         command.push(...remote);
      }

      appendOptionsFromArguments(command, arguments);

      if (command[0] !== 'push') {
         command.unshift('push');
      }

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Pushes the current tag changes to a remote which can be either a URL or named remote. When not specified uses the
    * default configured remote spec.
    */
   pushTags(remote?: string, then?: ResponseHandlerFn) {
      const command = ['push'];
      if (typeof remote === 'string') {
         command.push(remote);
      }
      command.push('--tags');

      return this._run(
         command,
         this._responseHandler(trailingFunctionArgument(arguments))
      );
   }

   /**
    * Executes any command against the git binary.
    */
   raw(commands: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {
      const command = appendOptionsFromArguments([], arguments);

      if (!command.length) {
         // TODO: should be setImmediate(() => then(new Error));
         throw new Error('Raw: must supply one or more command to execute');
      }

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Rebases the current working copy. Options can be supplied either as an array of string parameters
    * to be sent to the `git rebase` command, or a standard options object.
    */
   rebase(options: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {
      return this._run(
         appendOptionsFromArguments(['rebase'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments))
      );
   }

   /**
    * Call any `git remote` function with arguments passed as an array of strings.
    *
    * @param {string[]} options
    * @param {Function} [then]
    */
   remote(options: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {
      // TODO
      // if (!Array.isArray(options)) {
      //    return this.exec(function () {
      //       then && then(new TypeError('Git.remote requires an array of arguments'));
      //    });
      // }

      const commands = appendOptionsFromArguments([], arguments);

      if (commands[0] !== 'remote') {
         commands.unshift('remote');
      }

      return this._run(commands, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Removes an entry from the list of remotes.
    */
   removeRemote(remoteName: string, then: ResponseHandlerFn): SimpleGit {
      return this.remote(['remove', remoteName], then);
   }

   /**
    * Reset a repo
    *
    * TODO: add types usage for (mode, then) / (mode) / (then) / (mode, options, then) / (options, then) / (options)
    *
    * @param {string|string[]} [mode=soft] Either an array of arguments supported by the 'git reset' command, or the
    *                                        string value 'soft' or 'hard' to set the reset mode.
    * @param {Function} [then]
    */
   reset(mode?: 'mixed' | 'soft' | 'hard', then?: ResponseHandlerFn) {
      const command = appendOptionsFromArguments(['reset'], arguments);

      if (/^(mixed|soft|hard)$/.test(String(mode))) {
         command.push(`--${ mode }`);
      }
      else if (typeof mode === 'string' || typeof mode === 'function') {
         command.push('--soft');
      }

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Revert one or more commits in the local working copy
    */
   revert(commit: string, options: Options | OptionsArray, then: ResponseHandlerFn) {
      return this._run(
         appendOptionsFromArguments(['revert', commit], arguments),
         this._responseHandler(trailingFunctionArgument(arguments))
      );
   }

   /**
    * Wraps `git rev-parse`. Primarily used to convert friendly commit references (ie branch names) to SHA1 hashes.
    *
    * Options should be an array of string options compatible with the `git rev-parse`
    *
    * @see http://git-scm.com/docs/git-rev-parse
    */
   revparse(options: string[], then: ResponseHandlerFn) {
      return this._run(
         appendOptionsFromArguments(['rev-parse'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments), 'revParseParser'),
      );
   }

   /**
    * Removes the named files from source control.
    */
   rm(files: StringOrStrings, then?: ResponseHandlerFn) {
      return this._rm(files, '-f', then);
   }

   /**
    * Removes the named files from source control but keeps them on disk rather than deleting them entirely. To
    * completely remove the files, use `rm`.
    */
   rmKeepLocal(files: StringOrStrings, then?: ResponseHandlerFn) {
      return this._rm(files, '--cached', then);
   }

   /**
    * Show various types of objects, for example the file at a certain commit
    */
   show(options: string[], then?: ResponseHandlerFn) {
      return this._run(
         appendOptionsFromArguments(['show'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments)),
      );
   }

   /**
    * Disables/enables the use of the console for printing warnings and errors, by default messages are not shown in
    * a production environment.
    */
   silent(silence = false): SimpleGit {
      this._silentLogging = silence !== false;
      return this;
   }

   /**
    * Check the status of the local repo
    */
   status(then?: ResponseHandlerFn): SimpleGit {
      return this._run(
         ['status', '--porcelain', '-b', '-u'],
         this._responseHandler(then, 'StatusSummary')
      );
   }

   /**
    * List the stash(s) of the local repo
    */
   stashList(options?: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit {
      const handler = trailingFunctionArgument(arguments);
      const opt = (handler === then ? options : null) || {};

      const splitter = opt.splitter || requireResponseHandler('ListLogSummary').SPLITTER;
      const command = ['stash', 'list', '--pretty=format:'
      + requireResponseHandler('ListLogSummary').START_BOUNDARY
      + '%H %ai %s%d %aN %ae'.replace(/\s+/g, splitter)
      + requireResponseHandler('ListLogSummary').COMMIT_BOUNDARY
      ];

      if (Array.isArray(opt)) {
         command.push(...opt);
      }

      return this._run(command,
         this._responseHandler(handler, 'ListLogSummary', splitter)
      );
   }

   /**
    * Stash the local repo
    */
   public stash(options?: Options | OptionsArray): SimpleGit;
   public stash(then?: ResponseHandlerFn): SimpleGit;
   public stash(options: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit;
   public stash(): SimpleGit {
      return this._run(
         appendOptionsFromArguments(['stash'], arguments),
         this._responseHandler(trailingFunctionArgument(arguments))
      );
   }

   /**
    * Call any `git submodule` function with arguments passed as an array of strings.
    */
   subModule(options: Options | OptionsArray, then: ResponseHandlerFn): SimpleGit {

      const commands = appendOptionsFromArguments([], arguments);

      if (!commands.length || commands[0] !== 'submodule') {
         commands.unshift('submodule');
      }

      return this._run(commands, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * Add a submodule
    */
   submoduleAdd(repo: string, path: string, then: ResponseHandlerFn): SimpleGit {
      return this.subModule(['add', repo, path], then);
   }

   /**
    * Initialize submodules
    */
   submoduleInit(args: string[], then: ResponseHandlerFn): SimpleGit {
      return this.subModule(
         appendOptionsFromArguments(['init'], arguments),
         trailingFunctionArgument(arguments),
      );
   }

   /**
    * Update submodules
    */
   submoduleUpdate(args: string[], then: ResponseHandlerFn): SimpleGit {
      return this.subModule(
         appendOptionsFromArguments(['init'], arguments),
         trailingFunctionArgument(arguments),
      );
   }

   /**
    * Call any `git tag` function with arguments passed as an array of strings.
    */
   tag(options?: Options | OptionsArray, then?: ResponseHandlerFn): SimpleGit {
      const command = appendOptionsFromArguments([], arguments);

      if (command[0] !== 'tag') {
         command.unshift('tag');
      }

      return this._run(command, this._responseHandler(trailingFunctionArgument(arguments)));
   }

   /**
    * List all tags. When using git 2.7.0 or above, include an options object with `"--sort": "property-name"` to
    * sort the tags by that property instead of using the default semantic versioning sort.
    *
    * Note, supplying this option when it is not supported by your Git version will cause the operation to fail.
    */
   public tags(options: Options | OptionsArray): SimpleGit;
   public tags(then: ResponseHandlerFn<TagList>): SimpleGit;
   public tags(options: Options | OptionsArray, then: ResponseHandlerFn<TagList>): SimpleGit;
   public tags(): SimpleGit {
      const command = appendOptionsFromArguments(['-l'], arguments);

      const hasCustomSort = command.some((option) => /^--sort=/.test(option));

      return this.tag(
         command,
         this._responseHandler(trailingFunctionArgument(arguments), 'tagListParser', [hasCustomSort])
      );
   }

   /**
    * Deprecated method
    */
   then(handler: Function) {
      this._fail(
         new Error(`Deprecated method .then() has now been removed from the main interface.`),
         handler,
      );
   }

   /**
    * Updates repository server info
    */
   updateServerInfo(then?: ResponseHandlerFn): SimpleGit {
      return this._run(['update-server-info'], this._responseHandler(then));
   }

   /**
    * Internally uses pull and tags to get the list of tags then checks out the latest tag.
    *
    * TODO: check this works
    */
   checkoutLatestTag(then?: ResponseHandlerFn): SimpleGit {

      return this;
      // return this.pull(undefined, undefined, undefined, () => {
      //
      // })
      //    .tags(() => {
      //    })
      //    .checkout(() => {
      //    });

      // var git = this;
      // return this.pull(function () {
      //    git.tags(function (err, tags) {
      //       git.checkout(tags.latest, then);
      //    });
      // });
   }

   private _catFile(format: 'buffer' | 'utf-8', args: any) {
      const command = ['cat-file', ...flatten(args[0])];

      return this._run(command, this._responseHandler(trailingFunctionArgument(args)), {
         format,
      });
   }

   /**
    * Gets a function to be used for logging.
    */
   private _getLog(level: LogType, message: string) {
      if (this._silentLogging) {
         return;
      }

      console[level](message);
   }

   private _responseHandler(callback: any, type?: string, args: any[] = []): ResponseHandlerFn {
      return function (error, data) {
         if (typeof callback !== 'function') {
            return;
         }

         if (error) {
            return callback(error, null);
         }

         if (!type) {
            return callback(null, data);
         }

         const handler = requireResponseHandler(type);
         const parser = typeof handler.parse === 'function' ? handler.parse : handler;

         const result = parser(data, ...args);

         callback(null, result);
      };

   }

   private _rm(_files: StringOrStrings, options: string, then?: ResponseHandlerFn) {
      return this._run(
         ['rm', options, ...flatten(_files)],
         this._responseHandler(then)
      );
   }

   /**
    * Schedules the supplied command to be run, the command should not include the name of the git binary and should
    * be an array of strings passed as the arguments to the git binary.
    */
   private _run(command: string[], then: ResponseHandlerFn, opt?: RunOptions): SimpleGit {
      this._runCache.push([command, then, opt || {}]);
      this._schedule();

      return this;
   }

   private _schedule() {
      if (this._childProcess || this._runCache.length === 0) {
         return;
      }

      const git = this;
      const Buffer = dependencies.buffer();
      const ChildProcess = dependencies.childProcess();

      const [command, then, options] = git._runCache.shift() as RunCacheItem;

      debug(command);

      const result = deferred();

      let attempted = false;
      const attemptClose = (e: any) => {

         // closing when there is content, terminate immediately
         if (attempted || stdErr.length || stdOut.length) {
            result.resolve(e);
            attempted = true;
         }

         // first attempt at closing but no content yet, wait briefly for the close/exit that may follow
         if (!attempted) {
            attempted = true;
            setTimeout(attemptClose.bind(this, e), 50);
         }

      };

      const stdOut: any[] = [];
      const stdErr: any[] = [];
      const spawned = ChildProcess.spawn(git._command, command.slice(0), {
         cwd: git._baseDir,
         env: git._env,
         windowsHide: true
      });

      spawned.stdout.on('data', function (buffer: any) {
         stdOut.push(buffer);
      });

      spawned.stderr.on('data', function (buffer: any) {
         stdErr.push(buffer);
      });

      spawned.on('error', function (err: any) {
         stdErr.push(Buffer.from(err.stack, 'ascii'));
      });

      spawned.on('close', attemptClose);
      spawned.on('exit', attemptClose);

      result.promise.then(function (exitCode: number) {
         function done(output: any) {
            then.call(git, null, output);
         }

         function fail(error: string) {
            git._fail(error, then);
         }

         delete git._childProcess;

         if (exitCode && stdErr.length && options.onError) {
            options.onError(exitCode, Buffer.concat(stdErr).toString('utf-8'), done, fail);
         }
         else if (exitCode && stdErr.length) {
            fail(Buffer.concat(stdErr).toString('utf-8'));
         }
         else {
            if (options.concatStdErr) {
               stdOut.push(...stdErr);
            }

            let stdOutput = Buffer.concat(stdOut);
            if (options.format !== 'buffer') {
               stdOutput = stdOutput.toString(options.format || 'utf-8');
            }

            done(stdOutput);
         }

         process.nextTick(git._schedule.bind(git));
      });

      git._childProcess = spawned;

      if (git._outputHandler) {
         git._outputHandler(command[0], git._childProcess.stdout, git._childProcess.stderr);
      }
   }

   private _fail(error: any, handler: any) {
      this._getLog('error', error);
      this._runCache.length = 0;

      if (typeof handler === 'function') {
         handler(error instanceof Error ? error : new Error(error), null);
      }

      return this;
   }
}
