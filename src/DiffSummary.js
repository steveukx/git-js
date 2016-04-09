
module.exports = DiffSummary;

/**
 * The DiffSummary is returned as a response to getting `git().status()`
 *
 * @constructor
 */
function DiffSummary () {
   this.files = [];
   this.insertions = 0;
   this.deletions = 0;
}

/**
 * Number of lines added
 * @type {number}
 */
DiffSummary.prototype.insertions = 0;

/**
 * Number of lines deleted
 * @type {number}
 */
DiffSummary.prototype.deletions = 0;

DiffSummary.parse = function (text) {
   var line, handler;

   var lines = text.trim().split('\n');
   var status = new DiffSummary();

   var summary = lines.pop();
   if (summary) {
      summary.trim().split(', ').slice(1).forEach(function (text) {
         var summary = /(\d+)\s([a-z]+)/.exec(text);
         if (summary) {
            status[summary[2].replace(/s$/, '') + 's'] = parseInt(summary[1], 10);
         }
      });
   }

   while (line = lines.shift()) {
      line = line.trim().match(/^(.+)\s+\|\s+(\d+)\s+([+\-]+)$/);
      if (line) {
         status.files.push({
            file: line[1].trim(),
            changes: parseInt(line[2], 10),
            insertions: line[3].replace(/\-/g, '').length,
            deletions: line[3].replace(/\+/g, '').length
         });
      }
   }

   return status;
};
