import { PushResultRemoteMessages, RemoteMessageResult, RemoteMessages } from '../../../typings';
import { asNumber, LineParser, parseLinesWithContent } from '../utils';

class RemoteLineParser<T> extends LineParser<T> {

   protected addMatch(reg: RegExp, index: number, line?: string): boolean {
      return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
   }

   protected pushMatch(index: number, matched: string[]) {
      if (index > 0 || matched.length > 1) {
         super.pushMatch(index, matched);
      }
   }

}

const parsers: RemoteLineParser<RemoteMessageResult<PushResultRemoteMessages>>[] = [
   new RemoteLineParser(/^remote:\s*(.+)$/, (result, [text]) => {
      const message = text.trim();
      if (message) {
         result.remoteMessages.all.push(message);
      }
      return false;
   }),
   new RemoteLineParser([/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/], (result, [pullRequestUrl]) => {
      result.remoteMessages.pullRequestUrl = pullRequestUrl;
   }),
   new RemoteLineParser([/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/], (result, [count, summary, url]) => {
      result.remoteMessages.vulnerabilities = {
         count: asNumber(count),
         summary,
         url,
      };
   }),
];

export function parseRemoteMessages<T extends RemoteMessages = RemoteMessages>(
   _stdOut: string, stdErr: string,
): RemoteMessageResult {
   return parseLinesWithContent({remoteMessages: new RemoteMessageSummary() as T}, parsers, stdErr);
}

export class RemoteMessageSummary implements RemoteMessages {
   public readonly all: string[] = [];
}
