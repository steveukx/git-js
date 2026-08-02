import { asCamelCase, asNumber, LineParser, parseStringResponse } from '../utils';
import type { StringTask } from './task';

export interface CountObjectsResult {
   count: number;
   size: number;
   inPack: number;
   packs: number;
   sizePack: number;
   prunePackable: number;
   garbage: number;
   sizeGarbage: number;
}

function countObjectsResponse(): CountObjectsResult {
   return {
      count: 0,
      garbage: 0,
      inPack: 0,
      packs: 0,
      prunePackable: 0,
      size: 0,
      sizeGarbage: 0,
      sizePack: 0,
   };
}

const parser: LineParser<CountObjectsResult> = new LineParser(
   /([a-z-]+): (\d+)$/,
   (result, [key, value]) => {
      const property = asCamelCase(key);
      if (Object.hasOwn(result, property)) {
         result[property as keyof typeof result] = asNumber(value);
      }
   }
);

export function countObjects(): StringTask<CountObjectsResult> {
   return {
      commands: ['count-objects', '--verbose'],
      format: 'utf-8',
      parser(stdOut: string) {
         return parseStringResponse(countObjectsResponse(), [parser], stdOut);
      },
   };
}
