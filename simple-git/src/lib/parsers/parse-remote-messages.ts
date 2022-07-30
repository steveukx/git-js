import { PushResultRemoteMessages, RemoteMessageResult, RemoteMessages } from '../../../typings';
import { asNumber, parseStringResponse, RemoteLineParser } from '../utils';
import { remoteMessagesObjectParsers } from './parse-remote-objects';

const parsers: RemoteLineParser<RemoteMessageResult<PushResultRemoteMessages | RemoteMessages>>[] =
   [
      new RemoteLineParser(/^remote:\s*(.+)$/, (result, [text]) => {
         result.remoteMessages.all.push(text.trim());
         return false;
      }),
      ...remoteMessagesObjectParsers,
      new RemoteLineParser(
         [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
         (result, [pullRequestUrl]) => {
            (result.remoteMessages as PushResultRemoteMessages).pullRequestUrl = pullRequestUrl;
         }
      ),
      new RemoteLineParser(
         [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
         (result, [count, summary, url]) => {
            (result.remoteMessages as PushResultRemoteMessages).vulnerabilities = {
               count: asNumber(count),
               summary,
               url,
            };
         }
      ),
   ];

export function parseRemoteMessages<T extends RemoteMessages = RemoteMessages>(
   _stdOut: string,
   stdErr: string
): RemoteMessageResult {
   return parseStringResponse({ remoteMessages: new RemoteMessageSummary() as T }, parsers, stdErr);
}

export class RemoteMessageSummary implements RemoteMessages {
   public readonly all: string[] = [];
}
