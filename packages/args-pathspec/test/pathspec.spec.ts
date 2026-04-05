import { describe, expect, it } from 'vitest';

import { isPathSpec, pathspec, toPaths } from '../src/pathspec';

describe('pathspec', () => {
   it('detects single string pathspec wrapper', () => {
      const spec = pathspec('foo');

      expect(spec).toEqual(theStringObject('foo'));
      expect(isPathSpec(spec)).toBe(true);
      expect(toPaths(spec)).toEqual(['foo']);
   });

   it('detects multi string pathspec wrapper', () => {
      const spec = pathspec('foo', 'bar');

      expect(spec).toEqual(theStringObject('foo,bar'));
      expect(isPathSpec(spec)).toBe(true);
      expect(toPaths(spec)).toEqual(['foo', 'bar']);
   });

   it('rejects non-pathspec wrapper', () => {
      const real = pathspec('foo');
      const fake = theStringObject('foo');

      expect(real).toEqual(fake);
      expect(isPathSpec(fake)).toBe(false);
      expect(toPaths(fake as string)).toEqual([]);
   });

   function theStringObject(string: string) {
      return new String(string);
   }
});
