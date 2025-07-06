import {
   append,
   asCamelCase,
   asNumber,
   filterArray,
   filterFunction,
   filterHasLength,
   filterPlainObject,
   filterPrimitives,
   first,
   forEachLineWithContent,
   including,
   last,
   NOOP,
   orVoid,
   toLinesWithContent,
} from '../../src/lib/utils';

describe('utils', () => {
   describe('asCamelCase', () => {
      it.each([
         ['foo-bar', 'fooBar'],
         ['foo-bar-baz', 'fooBarBaz'],
         ['foo bar  baz', 'fooBarBaz'],
      ])('Converts %s to camelCase', (input, expected) => {
         expect(asCamelCase(input)).toBe(expected);
      });
   });

   describe('orVoid', () => {
      it.each([[null], [true], [''], ['non empty string'], [[]], [{}], [0], [1]])(
         'passes through %s',
         (item) => {
            expect(orVoid(item)).toBe(item);
         }
      );

      it.each([[false], [undefined]])('removes %s', (item) => {
         expect(orVoid(item)).toBe(undefined);
      });
   });

   describe('array edges', () => {
      it.each<[string, any, string | number | undefined, string | undefined]>([
         ['string array', ['abc', 'def'], 'abc', 'def'],
         ['variadic array', [123, 'abc', 456, 'def'], 123, 'def'],
         ['non array', { foo: 'bar' }, undefined, undefined],
         ['array-like', { foo: 'bar', 0: 'abc', 2: 'def', length: 3 }, 'abc', 'def'],
      ])('picks first and last from %s', (_type, input, expectedFirst, expectedLast) => {
         expect(first(input)).toBe(expectedFirst);
         expect(last(input)).toBe(expectedLast);
      });

      it('picks first with offset', () => {
         const input = ['abc', 'def'];
         expect(first(input, 1)).toBe('def');
         expect(first(input, 2)).toBe(undefined);
      });

      it('picks last with offset', () => {
         const input = ['abc', 'def'];
         expect(last(input, 1)).toBe('abc');
         expect(last(input, 2)).toBe(undefined);
      });
   });

   describe('asNumber', () => {
      it('from nullables', () => {
         expect((asNumber as any)()).toBe(0);
         expect(asNumber(undefined)).toBe(0);
         expect(asNumber(undefined, 5)).toBe(5);
         expect(asNumber(null)).toBe(0);
         expect(asNumber(null, 5)).toBe(5);
      });

      it('from NaN', () => {
         expect(asNumber('hello')).toBe(0);
         expect(asNumber('hello', 5)).toBe(5);
      });
   });

   describe('content', () => {
      it('caters for empty values', () => {
         expect(toLinesWithContent()).toEqual([]);
         expect(toLinesWithContent(undefined, false)).toEqual([]);
         expect(toLinesWithContent('')).toEqual([]);
         expect(toLinesWithContent('', false)).toEqual([]);
      });

      it('filters lines with content', () => {
         expect(toLinesWithContent(' \n content \n\n')).toEqual(['content']);
         expect(toLinesWithContent(' \n content \n\n', false)).toEqual([' ', ' content ']);
      });

      it('maps lines with content', () => {
         expect(forEachLineWithContent(' \n content \n\n', (line) => line.toUpperCase())).toEqual([
            'CONTENT',
         ]);
      });
   });

   describe('arrays', () => {
      function test<T>(target: T[] | Set<T>, itemA: T, itemB: T) {
         expect(append(target, itemA)).toBe(itemA);
         expect(Array.from(target)).toEqual([itemA]);

         expect(append(target, itemB)).toBe(itemB);
         expect(Array.from(target)).toEqual([itemA, itemB]);

         expect(append(target, itemA)).toBe(itemA);
         expect(Array.from(target)).toEqual([itemA, itemB]);
      }

      it('appends objects into an array', () => {
         test([], { a: 1 }, { b: 1 });
      });

      it('appends primitives into an array', () => {
         test<string>([], 'A', 'B');
      });

      it('appends objects into a set', () => {
         test(new Set(), { a: 1 }, { b: 1 });
      });

      it('appends primitives into a set', () => {
         test(new Set(), 'A', 'B');
      });
   });

   describe('including', () => {
      it('does nothing when the item already exists', () => {
         const input = ['abc', 'foo', 'bar'];
         const output = including(input, 'foo');

         expect(input).toBe(output);
         expect(output).toEqual(['abc', 'foo', 'bar']);
      });

      it('appends when the item does not exist', () => {
         const input = ['abc', 'bar'];
         const output = including(input, 'foo');

         expect(input).toBe(output);
         expect(output).toEqual(['abc', 'bar', 'foo']);
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
         expect(filterHasLength({ length: 1 })).toBe(true);
         expect(filterHasLength(Buffer.from('hello', 'utf8'))).toBe(true);

         expect(filterHasLength({})).toBe(false);
         expect(filterHasLength({ length: false })).toBe(false);
         expect(filterHasLength(1)).toBe(false);
         expect(filterHasLength(true)).toBe(false);
         expect(filterHasLength(undefined)).toBe(false);
         expect(filterHasLength(null)).toBe(false);
         expect(filterHasLength(NOOP)).toBe(false);
      });
   });
});
