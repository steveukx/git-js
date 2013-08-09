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
    * Internally uses pull and tags to get the list of tags then checks out the latest tag.
    * @param {Function} [then]
    */
   Git.prototype.checkoutLatestTag = function(then) {
      var git = this;
      return this.pull().tags(function(err, tags) {
         git.checkout(tags.latest, then);
      });
   };

   /**
    * Pull the updated contents of the current repo
    * @param {Function} [then]
    */
   Git.prototype.pull = function(then) {
      return this._run('git pull', function(err, data) {
         then && then(err, !err && this._parsePull(data));
      });
   };

   /**
    * List all tags
    * @param {Function} [then]
    */
   Git.prototype.tags = function(then) {
      return this._run('git tag -l', function(err, data) {
         then && then(err, !err && this._parseListTags(data));
      });
   };

   /**
    * Check out a tag or revision
    * @param {String} what
    * @param {Function} [then]
    */
   Git.prototype.checkout = function(what, then) {
      return this._run('git checkout "' + what + '"', function(err, data) {
         then && then(err, !err && this._parseCheckout(data));
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

   Git.prototype._parseCheckout = function(checkout) {
      // TODO
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
      return new Git(baseDir || __dirname);
   };

}());
