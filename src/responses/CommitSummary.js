
module.exports = CommitSummary;

function CommitSummary () {
   this.branch = '';
   this.commit = '';
   this.summary = {
      changes: 0,
      insertions: 0,
      deletions: 0
   };
}

CommitSummary.prototype.setBranchFromCommit = function (commitData) {
   if (commitData) {
      this.branch = commitData[1];
      this.commit = commitData[2];
   }
};

CommitSummary.prototype.setSummaryFromCommit = function (commitData) {
   if (this.branch && commitData) {
      this.summary.changes = commitData[1] || 0;
      this.summary.insertions = commitData[2] || 0;
      this.summary.deletions = commitData[3] || 0;
   }
};

CommitSummary.parse = function (commit) {
   var lines = commit.trim().split('\n');
   var i = 0;
   var len = lines.length;
   var commitSummary = new CommitSummary();
   for(;i<len;i++){
    if(i === 0){
      commitSummary.setBranchFromCommit(/\[([^\s]+) ([^\]]+)/.exec(lines[i]));
    }
    var re = /^\s{1,}\d+\s\S{1,}/; // 3 files changed
    if(re.test(lines[i])){
      commitSummary.setSummaryFromCommit(/(\d+)[^,]*(?:,\s*(\d+)[^,]*)?(?:,\s*(\d+))?/g.exec(lines[i]));
      break;
    }
   }
   return commitSummary;
};
