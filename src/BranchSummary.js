
module.exports = BranchSummary;

function BranchSummary () {
   this.current = '';
   this.all = [];
   this.branches = {};
}

BranchSummary.prototype.push = function (current, name, commit, label) {
   if (current) {
      this.current = name;
   }
   this.all.push(name);
   this.branches[name] = {
      current: current,
      name: name,
      commit: commit,
      label: label
   };
};

BranchSummary.parse = function (commit) {
   var branchSummary = new BranchSummary();

   commit.split('\n')
      .forEach(function (line) {
         var branch = /^(\*?\s+)(\S+)\s+([a-z0-9]+)\s(.*)$/.exec(line);
         if (branch) {
            branchSummary.push(
               branch[1].charAt(0) === '*',
               branch[2],
               branch[3],
               branch[4]
            );
         }
      });

   return branchSummary;
};
