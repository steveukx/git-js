
module.exports = {
   BranchDeleteSummary: require('../lib/responses/BranchDeleteSummary'),
   BranchSummary: require('../lib/responses/BranchSummary'),
   CommitSummary: require('./CommitSummary'),
   DiffSummary: require('./DiffSummary'),
   FetchSummary: require('./FetchSummary'),
   FileStatusSummary: require('../lib/responses/FileStatusSummary').FileStatusSummary,
   ListLogSummary: require('./ListLogSummary'),
   MergeSummary: require('./MergeSummary'),
   MoveSummary: require('./MoveSummary'),
   PullSummary: require('./PullSummary'),
   StatusSummary: require('../lib/responses/StatusSummary').StatusSummary,
};
