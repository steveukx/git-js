
module.exports = PullSummary;

/**
 * The PullSummary is returned as a response to getting `git().pull()`
 *
 * @constructor
 */
function PullSummary () {
   this.files = [];
   this.insertions = {};
   this.deletions = {};

   this.summary = {
      changes: 0,
      insertions: 0,
      deletions: 0
   }
}

/**
 * The array of file paths/names that have been modified in any part of the pulled content
 * @type {string[]}
 */
PullSummary.prototype.files = null;

/**
 * A map of file path to number to show the number of insertions per file.
 * @type {Object}
 */
PullSummary.prototype.insertions = null;

/**
 * A map of file path to number to show the number of deletions per file.
 * @type {Object}
 */
PullSummary.prototype.deletions = null;

/**
 * Overall summary of changes/insertions/deletions and the number associated with each
 * across all content that was pulled.
 * @type {Object}
 */
PullSummary.prototype.summary = null;

PullSummary.FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s(\+*)(\-*)/;
PullSummary.SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(\-\))?/;

PullSummary.parse = function (text) {
   var pullSummary = new PullSummary;

   for (var lines = text.split('\n'), i = 0, l = lines.length; i < l; i++) {
      var update = PullSummary.FILE_UPDATE_REGEX.exec(lines[i]);

      // search for update statement for each file
      if (update) {
         pullSummary.files.push(update[1]);

         var insertions = update[2].length;
         if (insertions) {
            pullSummary.insertions[update[1]] = insertions;
         }

         var deletions = update[3].length;
         if (deletions) {
            pullSummary.deletions[update[1]] = deletions;
         }
      }

      // summary appears after updates
      else if (pullSummary.files.length &&
               (update = PullSummary.SUMMARY_REGEX.exec(lines[i])) &&
               !(typeof(update[3]) === 'undefined' && typeof(update[5]) === 'undefined'))
      {
         pullSummary.summary.changes = +update[1] || 0;
         pullSummary.summary.insertions = +update[3] || 0;
         pullSummary.summary.deletions = +update[5] || 0;
      }
   }

   return pullSummary;
};
