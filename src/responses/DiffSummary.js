module.exports = DiffSummary;

/**
 * The DiffSummary is returned as a response to getting `git().status()`
 *
 * @constructor
 */
function DiffSummary() {
   this.files = [];
   this.changes = 0;
   this.insertions = 0;
   this.deletions = 0;
}

/**
 * Number of files changed
 * @type {number}
 */
DiffSummary.prototype.changes = 0;

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

DiffSummary.parse = function(text) {
   var line, handler;

   var lines = text.trim().split("\n");
   var summary = new DiffSummary();

   var summaryLine = lines.pop();
   if (summaryLine) {
      summaryLine
         .trim()
         .split(", ")
         .forEach(function(text) {
            parseTextToDiffSummary(text, summary);
         });
   }

   while ((line = lines.shift())) {
      textFileChange(line, summary.files) ||
         binaryFileChange(line, summary.files);
   }

   return summary;
};

function parseTextToDiffSummary(text, summary) {
   var changes = parseFilesChanged(text);
   if (changes) {
      summary.changes = changes;
      return;
   }
   var insertions = parseInsertion(text);
   if (insertions) {
      summary.insertions = insertions;
      return;
   }
   var deletions = parseDeletions(text);
   if (deletions) {
      summary.deletions = deletions;
      return;
   }
}

function parseFilesChanged(text) {
   var match = /(\d+)\sfile[s]?\schanged/.exec(text);
   return match ? parseInt(match[1], 10) : null;
}

function parseInsertion(text) {
   var match = /(\d+)\sinsertion[s]?\([+\-]\)/.exec(text);
   console.log("ble66", text);
   return match ? parseInt(match[1], 10) : null;
}

function parseDeletions(text) {
   var match = /(\d+)\sdeletion[s]?\([+\-]\)/.exec(text);
   return match ? parseInt(match[1], 10) : null;
}

function textFileChange(line, files) {
   line = line.trim().match(/^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/);

   if (line) {
      var alterations = (line[3] || "").trim();
      files.push({
         file: line[1].trim(),
         changes: parseInt(line[2], 10),
         insertions: alterations.replace(/-/g, "").length,
         deletions: alterations.replace(/\+/g, "").length,
         binary: false
      });

      return true;
   }
}

function binaryFileChange(line, files) {
   line = line.match(/^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)$/);
   if (line) {
      files.push({
         file: line[1].trim(),
         before: +line[2],
         after: +line[3],
         binary: true
      });
      return true;
   }
}
