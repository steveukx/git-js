
module.exports = StatusSummary;

function StatusSummary () {
   this.not_added = [];
   this.deleted = [];
   this.modified = [];
   this.created = [];
   this.conflicted = [];
}

StatusSummary.prototype.ahead = null;
StatusSummary.prototype.behind = null;
StatusSummary.prototype.current = null;
StatusSummary.prototype.tracking = null;

StatusSummary.parsers = {
   '##': function (line, status) {
      var aheadReg = /ahead (\d+)/;
      var behindReg = /behind (\d+)/;
      var currentReg = /^([^\s\.]*)\.*/;
      var trackingReg = /\.{3}(\S*)/;
      var regexResult;

      regexResult = aheadReg.exec(line);
      status.ahead = regexResult && regexResult[1];

      regexResult = behindReg.exec(line);
      status.behind = regexResult && regexResult[1];

      regexResult = currentReg.exec(line);
      status.current = regexResult && regexResult[1];

      regexResult = trackingReg.exec(line);
      status.tracking = regexResult && regexResult[1];
   },

   '??': function (line, status) {
      status.not_added.push(line);
   },

   D: function (line, status) {
      status.deleted.push(line);
   },

   M: function (line, status) {
      status.modified.push(line);
   },

   A: function (line, status) {
      status.created.push(line);
   },

   AM: function (line, status) {
      status.created.push(line);
   },

   UU: function (line, status) {
      status.conflicted.push(line);
   }
};

StatusSummary.parse = function (text) {
   var line, handler;

   var lines = text.trim().split('\n');
   var status = new StatusSummary();

   while (line = lines.shift()) {
      line = line.trim().match(/(\S+)\s+(.*)/);
      if (line && (handler = StatusSummary.parsers[line[1]])) {
         handler(line[2], status);
      }
   }

   return status;
};
