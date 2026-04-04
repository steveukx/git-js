import { describe, expect, it } from 'vitest';

import { parseArgv } from '../src/parse-argv';
import { pathspec } from '@simple-git/args-pathspec';
import { aParsedFlag } from './__fixtures__/mocks';

describe('parse-paths', () => {
   it('is empty when there are no path tokens', () => {
      expect(parseArgv('commit', '-m', 'msg').paths).toEqual([]);
   });

   it('collects tokens after a -- separator', () => {
      expect(parseArgv('add', '--', 'a.ts', 'b.ts').paths).toEqual(['a.ts', 'b.ts']);
   });

   it('does not include the -- separator itself', () => {
      expect(parseArgv('checkout', '--quiet', '--', 'src/index.ts').paths).toEqual([
         'src/index.ts',
      ]);
   });

   it('does not treat a -- consumed as a switch value as a separator', () => {
      // -m absorbs '--' as its message
      const { flags, paths } = parseArgv('commit', '-m', '--', pathspec('file-a'));
      expect(flags).toContainEqual(aParsedFlag('-m', '--'));
      expect(paths).toEqual(['file-a']);
   });

   it('unwraps pathspec() objects before the separator', () => {
      expect(parseArgv('checkout', pathspec('a.ts', 'b.ts')).paths).toEqual(['a.ts', 'b.ts']);
   });

   it('collects paths from both pathspec() objects and an explicit separator', () => {
      const { paths } = parseArgv(
         'checkout',
         '--quiet',
         pathspec('a.ts', 'b.ts'),
         '--',
         'c.ts',
         pathspec('d.ts')
      );
      expect(paths).toEqual(['a.ts', 'b.ts', 'c.ts', 'd.ts']);
   });

   it('routes tokens after -- to paths even when they look like flags', () => {
      const { flags, paths } = parseArgv('checkout', '--', '-not-a-switch', 'file.ts');
      expect(flags).toEqual([]);
      expect(paths).toEqual(['-not-a-switch', 'file.ts']);
   });
});
