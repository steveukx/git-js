import { asNumber, LineParser, parseLinesWithContent, RemoteLineParser } from '../utils';
import {
   PushResult,
   PushResultPushedItem
} from '../../../typings';

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


const parsers: LineParser<PushResult>[] = [
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
   new RemoteLineParser([/pull request/i, /\s(https?:\/\/\S+)$/], (result, [pullRequestUrl]) => {
      result.remoteMessages = {
         ...(result.remoteMessages || {}),
         pullRequestUrl,
      };
   }),
   new RemoteLineParser([/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/], (result, [count, summary, url]) => {
      result.remoteMessages = {
         ...(result.remoteMessages || {}),
         vulnerabilities: {
            count: asNumber(count),
            summary,
            url,
         },
      };
   })
];


export function parsePush(text: string): PushResult {
   const summary: PushResult = {
      pushed: [],
   };
   parseLinesWithContent(summary, parsers, text);
   return summary;
}
