function number(input: string | number): number {
   if (typeof input === 'string') {
      return parseInt(input.replace(/^\D+/g, ''), 10);
   }

   return 0;
}

function trimmed(input: string): string {
   return input.trim();
}

function versionTagNameFilter(tag: string): boolean {
   return tag.indexOf('.') >= 0;
}

function tagSortComparison(tagA: string, tagB: string) {
   const partsA = tagA.split('.');
   const partsB = tagB.split('.');

   if (partsA.length === 1 || partsB.length === 1) {
      return number(tagA) - number(tagB) > 0 ? 1 : -1;
   }

   for (let i = 0, max = Math.max(partsA.length, partsB.length); i < max; i++) {
      const diff = number(partsA[i]) - number(partsB[i]);

      if (diff) {
         return diff > 0 ? 1 : -1;
      }
   }

   return 0;
}


export class TagListResponse {

   constructor(
      public all: string[],
      public latest: string,
   ) {
   }


   static parse(output: string, customSort = false): TagListResponse {

      const tags = output
         .split('\n')
         .map(trimmed)
         .filter(Boolean);

      if (customSort) {
         return new TagListResponse(tags, tags[0]);
      }

      tags.sort(tagSortComparison);

      return new TagListResponse(tags,
         tags.filter(versionTagNameFilter).pop() as string);
   };

}
