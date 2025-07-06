import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { parseTagList } from '../../src/lib/responses/TagList';

describe('tags', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => (callback = jest.fn()));

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

      it('with max count shorthand property - callback', async () => {
         const queue = git.tags(callback);
         await closeWithSuccess(`
            0.1.1
            1.2.1
            1.1.1
         `);
         await queue;

         expect(callback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
               latest: '1.2.1',
               all: ['0.1.1', '1.1.1', '1.2.1'],
            })
         );

         assertExecutedCommands('tag', '-l');
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

      it('respects a custom sort order - callback', async () => {
         const queue = git.tags({ '--sort': 'foo' }, callback);
         await closeWithSuccess(`
            aaa
            0.10.0
            0.2.0
            bbb
         `);

         await queue;

         assertExecutedCommands('tag', '-l', '--sort=foo');
         expect(callback).toHaveBeenCalledWith(null, {
            latest: 'aaa',
            all: ['aaa', '0.10.0', '0.2.0', 'bbb'],
         });
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
