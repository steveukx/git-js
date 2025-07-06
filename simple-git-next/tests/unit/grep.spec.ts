import { promiseError } from '@kwsites/promise-result';

import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';

import { grepQueryBuilder, TaskConfigurationError } from '../..';
import { NULL } from '../../src/lib/utils';
import { pathspec } from '../../src/lib/args/pathspec';

describe('grep', () => {
   describe('grepQueryBuilder', () => {
      it('-e NODE -e Unexpected', () => {
         expect(Array.from(grepQueryBuilder('NODE', 'Unexpected'))).toEqual([
            '-e',
            'NODE',
            '-e',
            'Unexpected',
         ]);
      });

      it('-e #define --and ( -e MAX_PATH -e PATH_MAX )', () => {
         let query = grepQueryBuilder('#define').and('MAX_PATH', 'PATH_MAX');

         expect(Array.from(query)).toEqual([
            '-e',
            '#define',
            '--and',
            '(',
            '-e',
            'MAX_PATH',
            '-e',
            'PATH_MAX',
            ')',
         ]);
      });
   });

   describe('usage', () => {
      const callback = jest.fn();

      afterEach(() => callback.mockReset());

      it('prevents using -h as an option', async () => {
         const result = await promiseError(newSimpleGit().grep('hello', ['-h']));
         assertGitError(result, 'git.grep: use of "-h" is not supported', TaskConfigurationError);
      });

      it('single term with callback', async () => {
         const queue = newSimpleGit().grep('foo', callback);
         await closeWithSuccess(`file.txt${NULL}2`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '-e', 'foo');
         expect(callback).toHaveBeenCalledWith(null, await queue);
      });

      it('single term with options object and callback', async () => {
         const queue = newSimpleGit().grep('foo', { '--foo': 'bar' }, callback);
         await closeWithSuccess(`file.txt${NULL}2`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '--foo=bar', '-e', 'foo');
         expect(callback).toHaveBeenCalledWith(null, await queue);
      });

      it('single term with options array and callback', async () => {
         const queue = newSimpleGit().grep('foo', ['boo'], callback);
         await closeWithSuccess(`file.txt${NULL}2`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', 'boo', '-e', 'foo');
         expect(callback).toHaveBeenCalledWith(null, await queue);
      });

      it('awaits single term with options array', async () => {
         const queue = newSimpleGit().grep('foo', ['--bar']);
         await closeWithSuccess(`file.txt${NULL}2`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '--bar', '-e', 'foo');
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('awaits single term with options object', async () => {
         const queue = newSimpleGit().grep('foo', { '-c': null });
         await closeWithSuccess(`file.txt${NULL}2`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '-c', '-e', 'foo');
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('awaits single search term', async () => {
         const queue = newSimpleGit().grep('foo');
         await closeWithSuccess(`
path/to/file.txt${NULL}2${NULL}some foo content
another/file.txt${NULL}4${NULL}food content
      `);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '-e', 'foo');
         expect(await queue).toEqual({
            paths: new Set(['path/to/file.txt', 'another/file.txt']),
            results: {
               'path/to/file.txt': [
                  { line: 2, path: 'path/to/file.txt', preview: 'some foo content' },
               ],
               'another/file.txt': [{ line: 4, path: 'another/file.txt', preview: 'food content' }],
            },
         });
      });

      it('awaits multiple search terms', async () => {
         const queue = newSimpleGit().grep(grepQueryBuilder('a', 'b'));
         await closeWithSuccess(`file.txt${NULL}2${NULL}some foo content`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '-e', 'a', '-e', 'b');
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('awaits multiple search terms with options object', async () => {
         const queue = newSimpleGit().grep(grepQueryBuilder('a', 'b'), { '--c': null });
         await closeWithSuccess(`file.txt${NULL}2${NULL}some foo content`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '--c', '-e', 'a', '-e', 'b');
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('awaits multiple search terms with options array', async () => {
         const queue = newSimpleGit().grep(grepQueryBuilder('a', 'b'), ['--c']);
         await closeWithSuccess(`file.txt${NULL}2${NULL}some foo content`);

         assertExecutedCommands('grep', '--null', '-n', '--full-name', '--c', '-e', 'a', '-e', 'b');
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('appends paths provided as a pathspec in array TaskOptions', async () => {
         const queue = newSimpleGit().grep(grepQueryBuilder('a', 'b'), [
            pathspec('path/to'),
            '--c',
         ]);
         await closeWithSuccess(`file.txt${NULL}2${NULL}some foo content`);

         assertExecutedCommands(
            'grep',
            '--null',
            '-n',
            '--full-name',
            '--c',
            '-e',
            'a',
            '-e',
            'b',
            '--',
            'path/to'
         );
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });

      it('appends paths provided as a pathspec in object TaskOptions', async () => {
         const queue = newSimpleGit().grep(grepQueryBuilder('a', 'b'), {
            '--c': null,
            'paths': pathspec('path/to'),
         });
         await closeWithSuccess(`file.txt${NULL}2${NULL}some foo content`);

         assertExecutedCommands(
            'grep',
            '--null',
            '-n',
            '--full-name',
            '--c',
            '-e',
            'a',
            '-e',
            'b',
            '--',
            'path/to'
         );
         expect(await queue).toHaveProperty('paths', new Set(['file.txt']));
      });
   });
});
