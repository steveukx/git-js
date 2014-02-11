(function() {

   var ChildProcess = require('child_process');

   /**
    * Git handling for node. All public functions can be chained and all `then` handlers are optional.
    *
    * @param {String} baseDir
    * @constructor
    */
   function Git(baseDir) {
      this._baseDir = baseDir;
      this._runCache = [];
   }

   /**
    * Initalize a git repo
    *
    * @param {Function} [then]
    */
   Git.prototype.init = function(then) {
      return this._run('git init', function(err) {
         then && then(err);
      });
   };

   /**
    * Clone a git repo
    *
    * @param {String} repoPath
    * @param {String} localPath
    * @param {Function} [then]
    */
   Git.prototype.clone = function(repoPath, localPath, then ) {
      return this._run('git clone ' + repoPath + ' ' + localPath, function(err) {
         then && then(err);
      });
   };

   /**
    * Internally uses pull and tags to get the list of tags then checks out the latest tag.
    *
    * @param {Function} [then]
    */
   Git.prototype.checkoutLatestTag = function(then) {
      var git = this;
      return this.pull().tags(function(err, tags) {
         git.checkout(tags.latest, then);
      });
   };

   /**
    * Adds one or more files to source control
    *
    * @param {String|String[]} files
    * @param {Function} [then]
    */
   Git.prototype.add = function(files, then) {
      return this._run('git add "' + [].concat(files).join('" "') + '"', function(err, data) {
         then && then(err);
      });
   };

   /**
    * Commits changes in the current working directory - when specific file paths are supplied, only changes on those
    * files will be committed.
    *
    * @param {String} message
    * @param {String|String[]} [files]
    * @param {Function} [then]
    */
   Git.prototype.commit = function(message, files, then) {
      var git = this;
      if(!then && typeof files === "function") {
         then = files;
         files = [];
      }

      files = files ? ' "' + [].concat(files).join('" "') + '"' : '';

      return this._run('git commit -m "' + message.replace(/"/g, '\\"') + '"' + files, function(err, data) {
         then && then(err, !err && git._parseCommit(data));
      });
   };

   /**
    * Pull the updated contents of the current repo
    * @param {String} [remote]
    * @param {String} [branch]
    * @param {Function} [then]
    */
   Git.prototype.pull = function(remote, branch, then) {
      var command = "git pull";
      if (typeof remote === 'string' && typeof branch === 'string') {
         command += ' "' + remote + '" "' + branch + '"';
      }
      if (typeof arguments[arguments.length - 1] === 'function') {
         then = arguments[arguments.length - 1];
      }

      return this._run(command, function(err, data) {
         then && then(err, !err && this._parsePull(data));
      });
   };

   /**
    * Fetch the updated contents of the current repo.
    *
    * @example
    *   .fetch('upstream', 'master') // fetches from master on remote named upstream
    *   .fetch(function () {}) // runs fetch against default remote and branch and calls function
    *
    * @param {String} [remote]
    * @param {String} [branch]
    * @param {Function} [then]
    */
   Git.prototype.fetch = function(remote, branch, then) {
      var command = "git fetch";
      if (typeof remote === 'string' && typeof branch === 'string') {
         command += ' "' + remote + '" "' + branch + '"';
      }
      if (typeof arguments[arguments.length - 1] === 'function') {
         then = arguments[arguments.length - 1];
      }

      return this._run(command, function(err, data) {
         then && then(err, !err && this._parsePush(data));
      });
   };

   /**
    * List all tags
    *
    * @param {Function} [then]
    */
   Git.prototype.tags = function(then) {
      return this._run('git tag -l', function(err, data) {
         then && then(err, !err && this._parseListTags(data));
      });
   };

   /**
    * Check out a tag or revision
    *
    * @param {String} what
    * @param {Function} [then]
    */
   Git.prototype.checkout = function(what, then) {
      return this._run('git checkout "' + what + '"', function(err, data) {
         then && then(err, !err && this._parseCheckout(data));
      });
   };

   /**
    * Add a submodule
    *
    * @param {String} repo
    * @param {String} path
    * @param {Function} [then]
    */
   Git.prototype.submoduleAdd = function(repo, path, then) {
      return this._run('git submodule add "' + repo + '" "' + path + '"', function(err) {
         then && then(err);
      });
   };

   /**
    * List remote
    *
    * @param {String} [args]
    * @param {Function} [then]
    */
   Git.prototype.listRemote = function(args, then) {
      if (!then && typeof args === "function") {
         then = args;
         args = '';
      }
      return this._run('git ls-remote ' + args, function(err, data) {
         then && then(err, data);
      });
   };

   /**
    * Adds a remote to the list of remotes.
    *
    * @param {String} remoteName Name of the repository - eg "upstream"
    * @param {String} remoteRepo Fully qualified SSH or HTTP(S) path to the remote repo
    * @param {Function} [then]
    * @returns {*}
    */
   Git.prototype.addRemote = function(remoteName, remoteRepo, then) {
      return this._run('git remote add "' + remoteName + '" "' + remoteRepo + '"', function (err) {
         then && then(err);
      });
   };

   /**
    * Removes an entry from the list of remotes.
    *
    * @param {String} remoteName Name of the repository - eg "upstream"
    * @param {Function} [then]
    * @returns {*}
    */
   Git.prototype.removeRemote = function(remoteName, then) {
      return this._run('git remote remove "' + remoteName + '"', function (err) {
         then && then(err);
      });
   };

   /**
    * Pushes the current committed changes to a remote, optionally specify the names of the remote and branch to use
    * when pushing.
    *
    * @param {String} [remote]
    * @param {String} [branch]
    * @param {Function} [then]
    */
   Git.prototype.push = function(remote, branch, then) {
      var command = "git push";
      if (typeof remote === 'string' && typeof branch === 'string') {
         command += ' "' + remote + '" "' + branch + '"';
      }
      if (typeof arguments[arguments.length - 1] === 'function') {
         then = arguments[arguments.length - 1];
      }

      return this._run(command, function(err, data) {
         then && then(err, !err && this._parsePush(data));
      });
   };

   /**
    * Removes the named files from source control.
    *
    * @param {String|String[]} files
    * @param {Function} [then]
    */
   Git.prototype.rm = function(files, then) {
      return this._rm(files, '-f', then);
   };

   /**
    * Removes the named files from source control but keeps them on disk rather than deleting them entirely. To
    * completely remove the files, use `rm`.
    *
    * @param {String|String[]} files
    * @param {Function} [then]
    */
   Git.prototype.rmKeepLocal = function(files, then) {
      return this._rm(files, '--cached', then);
   };

   /**
    * Return repository changes.
    *
    * @param {String} [options]
    * @param {Function} [then]
    */
   Git.prototype.diff = function(options, then) {
      var command = 'git diff';

      if (typeof options === 'string' && typeof then === 'function') {
         command += ' ' + options;
      }

      if (typeof arguments[arguments.length - 1] === 'function') {
         then = arguments[arguments.length - 1];
      }

      return this._run(command, function(err, data) {
         then && then(err, data);
      });
   };

   Git.prototype._rm = function(files, options, then) {
      return this._run('git rm ' + options + ' "' + [].concat(files).join('" "') + '"', function(err) {
         then && then(err);
      });
   };

   Git.prototype._parsePull = function(pull) {
      var changes = {
         files: [],
         insertions: {},
         deletions: {},
         summary: {
            changes: 0,
            insertions: 0,
            deletions: 0
         }
      };

      var fileUpdateRegex = /^\s*(.+)\s\|\s(\d+)\s([\+]+)/;
      for(var lines = pull.split('\n'), i = 0, l = lines.length; i < l; i++) {
         var update = fileUpdateRegex.exec(lines[i]);

         // search for update statement for each file
         if(update) {
            changes.files.push(update[1]);

            var insertions = update[3].length;
            if(insertions) {
               changes.insertions[update[1]] = insertions;
            }
            if(update[2] > insertions) {
               changes.deletions[update[1]] = update[2] - insertions;
            }
         }

         // summary appears after updates
         else if(changes.files.length && (update = /(\d+)\D+(\d+)\D+(\d+)/.exec(lines[i]))) {
            changes.summary.changes = +update[1];
            changes.summary.insertions = +update[2];
            changes.summary.deletions = +update[3];
         }
      }

      return changes;
   };

   Git.prototype._parseListTags = function(tags) {
      var tagList = tags.split('\n').sort(function(tagA, tagB) {
         var partsA = tagA.split('.');
         var partsB = tagB.split('.');

         for(var i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
            var diff = partsA[i] - partsB[i];
            if(diff) {
               return diff > 0 ? 1 : -1;
            }
         }

         return 0;
      });

      return {
         latest: tagList.length && tagList[tagList.length - 1],
         all: tagList
      };
   };

   Git.prototype._parseCommit = function(commit) {
      var lines = commit.trim().split('\n');
      var branch = /\[([^\s]+) ([^\]]+)/.exec(lines.shift());
      var summary = /(\d+)[^,]*(?:,\s*(\d+)[^,]*)?(?:,\s*(\d+))?/g.exec(lines.shift()) || [];

      return {
         branch: branch[1],
         commit: branch[2],
         summary: {
            changes: (typeof summary[1] !== 'undefined') ? summary[1] : 0,
            insertions: (typeof summary[2] !== 'undefined') ? summary[2] : 0,
            deletions: (typeof summary[3] !== 'undefined') ? summary[3] : 0
         }
      };
   };


   Git.prototype._parseCheckout = function(checkout) {
      // TODO
   };

   Git.prototype._parseFetch = function(fetch) {
      return data;
   };

   Git.prototype._run = function(command, then) {
      this._runCache.push([command, then]);
      this._schedule();

      return this;
   };

   Git.prototype._schedule = function() {
      if(!this._childProcess && this._runCache.length) {
         var task = this._runCache.shift();
         var command = task[0];
         var then = task[1];

         this._childProcess = ChildProcess.exec(
             command,
             {cwd: this._baseDir},
             function(err, stdout, stderr) {
                delete this._childProcess;

                if(err) {
                   console.error(stderr);
                   this._runCache = [];
                   then.call(this, err, null);
                }
                else {
                   then.call(this, null, stdout);
                }

                process.nextTick(this._schedule.bind(this));
             }.bind(this));
      }
   };

   module.exports = function(baseDir) {
      return new Git(baseDir || process.cwd());
   };

}());
