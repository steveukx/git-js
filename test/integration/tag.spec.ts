import {
   createTestContext,
   like,
   newSimpleGit,
   newSimpleGitP,
   setUpFilesAdded,
   setUpInit,
   SimpleGitTestContext
} from '../__fixtures__';

describe('tag', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      await setUpInit(context);
      await setUpFilesAdded(context, ['foo', 'bar']);
   });

   it('deprecated(gitP) creates and gets the current named tag', async () => {
      const git = newSimpleGitP(context.root);
      expect(await git.addTag('newTag')).toEqual({name: 'newTag'});
      expect(String(await git.tag()).trim()).toBe('newTag');
   });

   it('creates and gets the current named tag', async () => {
      const git = newSimpleGit(context.root);
      expect(await git.addTag('newTag')).toEqual({name: 'newTag'});
      expect(String(await git.tag()).trim()).toBe('newTag');
   });

   it('lists all tags', async () => {
      await context.git.raw('tag', 'v1.0');
      await context.git.raw('tag', 'v1.5');

      expect(await newSimpleGit(context.root).tags()).toEqual(like({
         all: ['v1.0', 'v1.5'],
         latest: 'v1.5',
      }));
   });

});
