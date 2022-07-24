import {
   PullDetailFileChanges,
   PullDetailSummary,
   PullFailedResult,
   PullResult,
} from '../../../typings';

export class PullSummary implements PullResult {
   public remoteMessages = {
      all: [],
   };
   public created = [];
   public deleted: string[] = [];
   public files: string[] = [];
   public deletions: PullDetailFileChanges = {};
   public insertions: PullDetailFileChanges = {};
   public summary: PullDetailSummary = {
      changes: 0,
      deletions: 0,
      insertions: 0,
   };
}

export class PullFailedSummary implements PullFailedResult {
   remote = '';
   hash = {
      local: '',
      remote: '',
   };
   branch = {
      local: '',
      remote: '',
   };
   message = '';

   toString() {
      return this.message;
   }
}
