import {
   RemoteMessageResult,
   RemoteMessages,
   RemoteMessagesObjectEnumeration,
} from '../../../typings';
import { asNumber, RemoteLineParser } from '../utils';

function objectEnumerationResult<T extends RemoteMessages = RemoteMessages>(
   remoteMessages: T
): RemoteMessagesObjectEnumeration {
   return (remoteMessages.objects = remoteMessages.objects || {
      compressing: 0,
      counting: 0,
      enumerating: 0,
      packReused: 0,
      reused: { count: 0, delta: 0 },
      total: { count: 0, delta: 0 },
   });
}

function asObjectCount(source: string) {
   const count = /^\s*(\d+)/.exec(source);
   const delta = /delta (\d+)/i.exec(source);

   return {
      count: asNumber((count && count[1]) || '0'),
      delta: asNumber((delta && delta[1]) || '0'),
   };
}

export const remoteMessagesObjectParsers: RemoteLineParser<RemoteMessageResult<RemoteMessages>>[] =
   [
      new RemoteLineParser(
         /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
         (result, [action, count]) => {
            const key = action.toLowerCase();
            const enumeration = objectEnumerationResult(result.remoteMessages);

            Object.assign(enumeration, { [key]: asNumber(count) });
         }
      ),
      new RemoteLineParser(
         /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
         (result, [action, count]) => {
            const key = action.toLowerCase();
            const enumeration = objectEnumerationResult(result.remoteMessages);

            Object.assign(enumeration, { [key]: asNumber(count) });
         }
      ),
      new RemoteLineParser(
         /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
         (result, [total, reused, packReused]) => {
            const objects = objectEnumerationResult(result.remoteMessages);
            objects.total = asObjectCount(total);
            objects.reused = asObjectCount(reused);
            objects.packReused = asNumber(packReused);
         }
      ),
   ];
