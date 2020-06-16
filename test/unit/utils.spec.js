import {
   filterArray,
   filterFunction,
   filterHasLength,
   filterPlainObject,
   filterPrimitives,
   NOOP
} from "../../src/lib/utils";

describe('utils', () => {

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
