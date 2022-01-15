import { PullDetailFileChanges, PullDetailSummary, PullResult } from '../../../typings';

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


