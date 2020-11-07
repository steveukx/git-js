import { getTrailingOptions, appendTaskOptions } from '../../src/lib/utils';

describe('task-options', () => {
   describe('getTrailingOptions', () => {
      function callback () {}

      it.each([
         test('no options supplied', [], []),
         test('just callback supplied', [], [callback]),
         test('just primitives supplied', [], ['hello', 'world']),
         test('just primitives when 0 included', [], ['a', 'b', 'c'], 0),
         test('just primitives when 2 included', ['a', 'b'], ['a', 'b', 'c'], 2),
         test('just primitives when all included', ['a', 'b', 'c'], ['a', 'b', 'c'], -1),
         test('just primitives sround others', ['a', 'c'], ['a', {a:'b'}, 'c'], -1),

         test('options array as last argument', ['b'], ['a', ['b']]),
         test('options array behind callback', ['b'], ['a', ['b'], callback]),

         test('options object as last argument', ['b'], ['a', {b: null}]),
         test('options object with values last argument', ['b=c'], ['a', {b: 'c'}]),
         test('options object behind callback', ['b'], ['a', {b: null}, callback]),
         test('options object with values behind callback', ['b=c'], ['a', {b: 'c'}, callback]),

         test('primitive: string and array', ['a', 'c'], ['a', 'b', ['c']], 1),
         test('primitive: number', ['1', 'c'], [1, 'a', 'b', ['c']], 1),
      ])('Default primitives %s', (name, {expected, args}) => {
         expect(getTrailingOptions(...args)).toEqual(expected);
      });

      function test(name: string, expected: string[], args: any, includeInitialPrimitives?: number) {
         return [name, {
            expected,
            args: typeof includeInitialPrimitives === 'number' ? [args, includeInitialPrimitives] : [args],
         }];
      }
   })

   describe("appendTaskOptions", () => {
      it('appends correct task options', () => {
         expect(appendTaskOptions({})).toEqual([])
         expect(appendTaskOptions({ foo: 'bar', number: 1 })).toEqual(["foo=bar", "number=1"])
         expect(appendTaskOptions({ bool: true, foo: 'bar' })).toEqual(["bool", "foo=bar"])
      })
   });
});
