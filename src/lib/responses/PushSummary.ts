import { PushDetail, PushResult, PushResultPushedItem, PushResultRemoteMessages } from '../../../typings';
import { TaskParser } from '../tasks/task';
import { LineParser, parseLinesWithContent } from '../utils';
import { parseRemoteMessages } from '../parsers/parse-remote-messages';

class PushSummaryPushed implements PushResultPushedItem {

   public readonly branch: boolean;
   public readonly deleted: boolean;
   public readonly tag: boolean;
   public readonly alreadyUpdated: boolean;
   public readonly new: boolean;

   constructor(
      public readonly local: string,
      public readonly remote: string,
      status: string,
   ) {
      this.deleted = status.includes('deleted');
      this.tag = status.includes('tag') || /^refs\/tags/.test(local);
      this.branch = !this.tag;
      this.new = status.includes('new');
      this.alreadyUpdated = !this.new;
   }
}

const parsers: LineParser<PushDetail>[] = [
   new LineParser(/^Pushing to (.+)$/, (result, [repo]) => {
      result.repo = repo;
   }),
   new LineParser(/^updating local tracking ref '(.+)'/, (result, [local]) => {
      result.ref = {
         ...(result.ref || {}),
         local,
      }
   }),
   new LineParser(/^[*-=]\s+([^:]+):(\S+)\s+\[(.+)]$/, (result, [local, remote, type]) => {
      result.pushed.push(new PushSummaryPushed(local, remote, type));
   }),
   new LineParser(/^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/, (result, [local, remote, remoteName]) => {
      result.branch = {
         ...(result.branch || {}),
         local,
         remote,
         remoteName,
      };
   }),
   new LineParser(/^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/, (result, [local, remote, from, to]) => {
      result.update = {
         head: {
            local,
            remote,
         },
         hash: {
            from,
            to,
         },
      };
   }),
];

export const parsePushSummary: TaskParser<string, PushResult> = (stdOut, stdErr) => {
   const pushDetail = parsePushDetail(stdOut, stdErr);
   const responseDetail = parseRemoteMessages<PushResultRemoteMessages>(stdOut, stdErr);

   return {
      ...pushDetail,
      ...responseDetail,
   };
}

export const parsePushDetail: TaskParser<string, PushDetail> = (stdOut, stdErr) => {
   return parseLinesWithContent({pushed: []}, parsers, `${stdOut}\n${stdErr}`);
}
