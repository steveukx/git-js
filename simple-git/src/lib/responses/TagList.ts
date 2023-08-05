import { TagResult } from '../../../typings';

export class TagList implements TagResult {
   constructor(
      public readonly all: string[],
      public readonly latest: string | undefined
   ) {}
}

export const parseTagList = function (data: string, customSort = false) {
   const tags = data.split('\n').map(trimmed).filter(Boolean);

   if (!customSort) {
      tags.sort(function (tagA, tagB) {
         const partsA = tagA.split('.');
         const partsB = tagB.split('.');

         if (partsA.length === 1 || partsB.length === 1) {
            return singleSorted(toNumber(partsA[0]), toNumber(partsB[0]));
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

   const latest = customSort ? tags[0] : [...tags].reverse().find((tag) => tag.indexOf('.') >= 0);

   return new TagList(tags, latest);
};

function singleSorted(a: number, b: number): number {
   const aIsNum = isNaN(a);
   const bIsNum = isNaN(b);

   if (aIsNum !== bIsNum) {
      return aIsNum ? 1 : -1;
   }

   return aIsNum ? sorted(a, b) : 0;
}

function sorted(a: number, b: number) {
   return a === b ? 0 : a > b ? 1 : -1;
}

function trimmed(input: string) {
   return input.trim();
}

function toNumber(input: string | undefined) {
   if (typeof input === 'string') {
      return parseInt(input.replace(/^\D+/g, ''), 10) || 0;
   }

   return 0;
}
