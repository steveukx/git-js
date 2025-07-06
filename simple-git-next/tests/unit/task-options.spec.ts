import { getTrailingOptions } from '../../src/lib/utils';

type OptionsTest = [string, { expected: string[]; args: [any] | [any, number] }];

describe('task-options', () => {
   function callback() {}

   it.each<OptionsTest>([
      test('no options supplied', [], []),
      test('just callback supplied', [], [callback]),
      test('just primitives supplied', [], ['hello', 'world']),
      test('just primitives when 0 included', [], ['a', 'b', 'c'], 0),
      test('just primitives when 2 included', ['a', 'b'], ['a', 'b', 'c'], 2),
      test('just primitives when all included', ['a', 'b', 'c'], ['a', 'b', 'c'], -1),
      test('just primitives sround others', ['a', 'c'], ['a', { a: 'b' }, 'c'], -1),

      test('options array as last argument', ['b'], ['a', ['b']]),
      test('options array behind callback', ['b'], ['a', ['b'], callback]),

      test('options object as last argument', ['b'], ['a', { b: null }]),
      test('options object with values last argument', ['b=c'], ['a', { b: 'c' }]),
      test('options object behind callback', ['b'], ['a', { b: null }, callback]),
      test('options object with values behind callback', ['b=c'], ['a', { b: 'c' }, callback]),

      test('primitive: string and array', ['a', 'c'], ['a', 'b', ['c']], 1),
      test('primitive: number', ['1', 'c'], [1, 'a', 'b', ['c']], 1),
   ])('Default primitives %s', (_name, { expected, args }) => {
      expect((getTrailingOptions as any)(...args)).toEqual(expected);
   });

   function test(
      name: string,
      expected: string[],
      args: any,
      includeInitialPrimitives?: number
   ): OptionsTest {
      return [
         name,
         {
            expected,
            args:
               typeof includeInitialPrimitives === 'number'
                  ? [args, includeInitialPrimitives]
                  : [args],
         },
      ];
   }
});
