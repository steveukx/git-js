
var TaskRunner = require('task-runner').TaskRunner;
var ChildProcess = require('child_process');

function Git(baseDir) {
   this._baseDir = baseDir;
}

Git.prototype.pull = function(then) {
   this._run('git pull', function(err, data) {
      then(err, !err && this._parsePull(data));
   });
};

Git.prototype._parsePull = function(pull) {

};

Git.prototype._run = function(command, then) {
   ChildProcess.exec(
       command,
       {cwd: this._baseDir},
       function(err, stdout, stderr) {
          if(err) {
             console.error(stderr);
             then(err, null);
          }
          else {
             then(null, stdout);
          }
       });
};

Git.export = function(baseDir) {
   return new Git(baseDir || __dirname);
};
