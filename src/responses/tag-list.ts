import { TagResult } from '../../typings/response';

export class TagList implements TagResult {

   constructor (
      public all: string[],
      public latest: string,
   ) {}

}

export function tagListParser (data: string, customSort?: any): TagResult {

   const tags: string[] = data
      .split('\n')
      .map(trimmed)
      .filter(Boolean);

   if (!customSort) {
      tags.sort(function (tagA: string, tagB: string) {
         const partsA = tagA.split('.');
         const partsB = tagB.split('.');

         if (partsA.length === 1 || partsB.length === 1) {
            return sorted(tagA, tagB);
         }

         for (let i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
            const diff = sorted(toNumber(partsA[i]), toNumber(partsB[i]));

            if (diff) {
               return diff;
            }
         }

         return 0;
      });
   }

   const latest = customSort ? tags[0] : tags.filter(function (tag) {
      return tag.indexOf('.') >= 0;
   }).pop();

   return new TagList(tags, String(latest));
}

function sorted (a: any, b: any): number {
   return a === b ? 0 : a - b > 0 ? 1 : -1;
}

function trimmed (input: string): string {
   return input.trim();
}

function toNumber (input?: string): number {
   if (typeof input === 'string') {
      return parseInt(input.replace(/^\D+/g, ''), 10) || 0;
   }

   return 0;
}
