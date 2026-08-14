import type { SimpleGitCore } from '../../index';
import { parseTagList } from '../../src/responses';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('tags', () => {
   let git: SimpleGitCore;

   describe('simple-git', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('with a character prefix', () => {
         expect(parseTagList('v1.0.0 \n v0.0.1 \n v0.6.2')).toEqual(
            expect.objectContaining({
               latest: 'v1.0.0',
               all: ['v0.0.1', 'v0.6.2', 'v1.0.0'],
            })
         );
      });

      it('with a character prefix and different lengths', () => {
         expect(parseTagList('v1.0 \n v1.0.1')).toEqual(
            expect.objectContaining({
               latest: 'v1.0.1',
               all: ['v1.0', 'v1.0.1'],
            })
         );
      });

      it('removes empty lines', async () => {
         const tags = git.tags();
         await closeWithSuccess(`
             0.1.0
             0.10.0
             0.10.1

             0.2.0

             1.10.0

             tagged
         `);

         expect(await tags).toEqual(
            expect.objectContaining({
               latest: '1.10.0',
               all: ['0.1.0', '0.2.0', '0.10.0', '0.10.1', '1.10.0', 'tagged'],
            })
         );
         assertExecutedCommands('tag', '-l');
      });

      it('respects a custom sort order - async', async () => {
         const tags = git.tags({ '--sort': 'foo' });
         await closeWithSuccess(`
            aaa
            0.10.0
            0.2.0
            bbb
         `);

         expect(await tags).toEqual(
            expect.objectContaining({
               latest: 'aaa',
               all: ['aaa', '0.10.0', '0.2.0', 'bbb'],
            })
         );
         assertExecutedCommands('tag', '-l', '--sort=foo');
      });
   });
});
