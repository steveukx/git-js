
module.exports = ListLogSummary;

/**
 * The ListLogSummary is returned as a response to getting `git().log()` or `git().stashList()`
 *
 * @constructor
 */
function ListLogSummary (all) {
   this.all = all;
   this.latest = all.length && all[0] || null;
   this.total = all.length;
}

/**
 * Detail for each of the log lines
 * @type {ListLogLine[]}
 */
ListLogSummary.prototype.all = null;

/**
 * Most recent entry in the log
 * @type {ListLogLine}
 */
ListLogSummary.prototype.latest = null;

/**
 * Number of items in the log
 * @type {number}
 */
ListLogSummary.prototype.total = 0;

function ListLogLine (line) {
   this.hash = line[0];
   this.date = line[1];
   this.message = line[2];
   this.author_name = line[3];
   this.author_email = line[4];
}

ListLogSummary.parse = function (text, splitter) {
   return new ListLogSummary(
      text.split('\n').filter(Boolean).map(function (item) {
         return new ListLogLine(item.split(splitter));
      })
   );
};
