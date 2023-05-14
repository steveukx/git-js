import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';
import { grepQueryBuilder } from '../..';
import { pathspec } from '../../src/lib/args/pathspec';

describe('grep', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpFiles(context);
   });

   it('finds tracked files matching a string', async () => {
      const result = await newSimpleGit(context.root).grep('foo');

      expect(result).toEqual({
         paths: new Set(['foo/bar.txt']),
         results: {
            'foo/bar.txt': [{ line: 4, path: 'foo/bar.txt', preview: ' foo/bar' }],
         },
      });
   });

   it('finds tracked files matching multiple strings', async () => {
      // finds all instances of `line` when there is also either `one` or `two` on the line
      // ie: doesn't find `another line`
      const result = await newSimpleGit(context.root).grep(
         grepQueryBuilder('line').and('one', 'two')
      );

      expect(result).toEqual({
         paths: new Set(['a/aaa.txt', 'foo/bar.txt']),
         results: {
            'a/aaa.txt': [
               { line: 1, path: 'a/aaa.txt', preview: 'something on line one' },
               { line: 2, path: 'a/aaa.txt', preview: 'this is line two' },
            ],
            'foo/bar.txt': [
               { line: 1, path: 'foo/bar.txt', preview: 'something on line one' },
               { line: 2, path: 'foo/bar.txt', preview: 'this is line two' },
            ],
         },
      });
   });

   it('finds multiple tracked files matching a string', async () => {
      const result = await newSimpleGit(context.root).grep('something');

      expect(result).toEqual({
         paths: new Set(['a/aaa.txt', 'foo/bar.txt']),
         results: {
            'foo/bar.txt': [{ line: 1, path: 'foo/bar.txt', preview: 'something on line one' }],
            'a/aaa.txt': [{ line: 1, path: 'a/aaa.txt', preview: 'something on line one' }],
         },
      });
   });

   it('finds multiple tracked files matching any string', async () => {
      const result = await newSimpleGit(context.root).grep(grepQueryBuilder('something', 'foo'));

      expect(result).toEqual({
         paths: new Set(['a/aaa.txt', 'foo/bar.txt']),
         results: {
            'foo/bar.txt': [
               { line: 1, path: 'foo/bar.txt', preview: 'something on line one' },
               { line: 4, path: 'foo/bar.txt', preview: ' foo/bar' },
            ],
            'a/aaa.txt': [{ line: 1, path: 'a/aaa.txt', preview: 'something on line one' }],
         },
      });
   });

   it('can be used to find the matching lines count per file without line detail', async () => {
      const result = await newSimpleGit(context.root).grep('line', { '-c': null });

      expect(result).toEqual({
         paths: new Set(['a/aaa.txt', 'foo/bar.txt']),
         results: {
            'foo/bar.txt': [{ line: 3, path: 'foo/bar.txt' }],
            'a/aaa.txt': [{ line: 3, path: 'a/aaa.txt' }],
         },
      });
   });

   it('also finds untracked files on request', async () => {
      const result = await newSimpleGit(context.root).grep('foo', { '--untracked': null });

      expect(result).toEqual({
         paths: new Set(['foo/bar.txt', 'foo/baz.txt']),
         results: {
            'foo/bar.txt': [{ line: 4, path: 'foo/bar.txt', preview: ' foo/bar' }],
            'foo/baz.txt': [{ line: 4, path: 'foo/baz.txt', preview: ' foo/baz' }],
         },
      });
   });

   it('limits within a set of paths', async () => {
      const result = await newSimpleGit(context.root).grep('foo', {
         '--untracked': null,
         'paths': pathspec('foo/bar.txt'),
      });

      expect(result).toEqual({
         paths: new Set(['foo/bar.txt']),
         results: {
            'foo/bar.txt': [{ line: 4, path: 'foo/bar.txt', preview: ' foo/bar' }],
         },
      });
   });
});

async function setUpFiles(context: SimpleGitTestContext) {
   const content = `something on line one\nthis is line two\n  another  line  `;

   await context.git.init();

   // tracked files
   await context.file(['foo', 'bar.txt'], `${content}\n foo/bar `);
   await context.file(['a', 'aaa.txt'], `${content}\n a/aaa `);
   await context.git.add('*');

   // untracked files
   await context.file(['foo', 'baz.txt'], `${content}\n foo/baz `);
   await context.file(['a', 'bbb.txt'], `${content}\n a/bbb `);
}
