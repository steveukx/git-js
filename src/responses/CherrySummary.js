
module.exports = CherrySummary;

function CherrySummary () {
   this.commits = [];
   this.commitSubjects = [];
}

CherrySummary.prototype.push = function (commit, subject) {
  this.commits.push(commit);
  if (typeof subject === 'string' && subject.length > 0) {
    this.commitSubjects.push(subject);
  }
};

CherrySummary.parse = function (commits) {
   var cherrySummary = new CherrySummary();

   commits.split('\n')
      .forEach(function (line) {
        var match = line.trim().match(/\+\s+([0-9a-f]{5,40}) ?(.*)$/i);
        if (match) {
          cherrySummary.push(match[1].trim(), match[2].trim());
        }
      });

   return cherrySummary;
};
