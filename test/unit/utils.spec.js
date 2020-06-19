import {
   append,
   filterArray,
   filterFunction,
   filterHasLength,
   filterPlainObject,
   filterPrimitives, forEachLineWithContent,
   NOOP, toLinesWithContent
} from "../../src/lib/utils";

describe('utils', () => {

   describe('content', () => {

      it('filters lines with content', () => {
         expect(toLinesWithContent(' \n content \n\n')).toEqual(['content']);
         expect(toLinesWithContent(' \n content \n\n', false)).toEqual([' ', ' content ']);
      });

      it('maps lines with content', () => {
         expect(forEachLineWithContent(' \n content \n\n', (line) => line.toUpperCase()))
            .toEqual(['CONTENT']);
         expect(forEachLineWithContent(' \n content \n\n', true, (line) => line.toUpperCase()))
            .toEqual(['CONTENT']);
         expect(forEachLineWithContent(' \n content \n\n', false, (line) => line.toUpperCase()))
            .toEqual([' ', ' CONTENT ']);
      });

   });

   describe('arrays', () => {

      function test (target, itemA, itemB) {
         expect(append(target, itemA)).toBe(itemA);
         expect(Array.from(target)).toEqual([itemA]);

         expect(append(target, itemB)).toBe(itemB);
         expect(Array.from(target)).toEqual([itemA, itemB]);

         expect(append(target, itemA)).toBe(itemA);
         expect(Array.from(target)).toEqual([itemA, itemB]);
      }

      it('appends objects into an array', () => {
         test([], {a: 1}, {b: 1});
      });
      it('appends primitives into an array', () => {
         test([], 'A', 'B');
      });
      it('appends objects into a set', () => {
         test(new Set(), {a: 1}, {b: 1});
      });
      it('appends primitives into a set', () => {
         test(new Set(), 'A', 'B');
      });
   });

   describe('argument filtering', () => {

      it('recognises arrays', () => {
         expect(filterArray([])).toBe(true);
         expect(filterArray({})).toBe(false);
         expect(filterArray(undefined)).toBe(false);
      });

      it('recognises primitives', () => {
         expect(filterPrimitives([])).toBe(false);
         expect(filterPrimitives({})).toBe(false);
         expect(filterPrimitives(undefined)).toBe(false);

         expect(filterPrimitives(123.456)).toBe(true);
         expect(filterPrimitives('hello world')).toBe(true);
         expect(filterPrimitives(false)).toBe(true);
         expect(filterPrimitives(true)).toBe(true);
      });

      it('recognises plain objects', () => {
         expect(filterPlainObject({})).toBe(true);
         expect(filterPlainObject(Object.create(null))).toBe(true);

         expect(filterPlainObject(NOOP)).toBe(false);
      });

      it('recognises functions', () => {
         expect(filterFunction(NOOP)).toBe(true);
         expect(filterFunction(() => {})).toBe(true);

         expect(filterFunction({})).toBe(false);
      });

      it('recognises entities with a length', () => {
         expect(filterHasLength([])).toBe(true);
         expect(filterHasLength('')).toBe(true);
         expect(filterHasLength({length: 1})).toBe(true);
         expect(filterHasLength(Buffer.from('hello', 'utf8'))).toBe(true);

         expect(filterHasLength({})).toBe(false);
         expect(filterHasLength({length: false})).toBe(false);
         expect(filterHasLength(1)).toBe(false);
         expect(filterHasLength(true)).toBe(false);
         expect(filterHasLength(undefined)).toBe(false);
         expect(filterHasLength(null)).toBe(false);
         expect(filterHasLength(NOOP)).toBe(false);
      });

   });
});
