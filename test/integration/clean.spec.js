const Test = require('./include/runner');

const {CleanOptions} = require('../..');

describe('clean', () => {

   let context;

   beforeEach(() => context = Test.createContext());
   beforeEach(async () => {
      const git = context.gitP(context.root);

      context.file(null, '.gitignore', 'ignored.*\n');
      ['ignored.one', 'ignored.two', 'tracked.bbb', 'un-tracked.ccc']
         .forEach(name => context.file(undefined, name, `${ name }\n${ name }`));

      await git.init();
      await git.add(['*.bbb', '.gitignore']);
      await git.commit('first');
   });

   it('rejects on bad configuration', async () => {
      const git = context.gitP(context.root);
      let error;
      try {
         await git.clean(CleanOptions.DRY_RUN, ['--interactive']);
      }
      catch (e) {
         error = e;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/interactive mode/i);
   });

   it('removes ignored files', async () => {
      const git = context.gitP(context.root);
      expect(await git.clean(CleanOptions.FORCE + CleanOptions.IGNORED_ONLY))
         .toEqual(expect.objectContaining({
            dryRun: false,
            files: ['ignored.one', 'ignored.two'],
         }));
   });

   it('removes un-tracked and ignored files', async () => {
      const git = context.gitP(context.root);
      expect(await git.clean([CleanOptions.DRY_RUN, CleanOptions.IGNORED_INCLUDED]))
         .toEqual(expect.objectContaining({
            dryRun: true,
            files: ['ignored.one', 'ignored.two', 'un-tracked.ccc'],
         }));
   });

   it('handles a CleanOptions array with regular options array', async () => {
      const git = context.gitP(context.root);
      [['one', 'abc'], ['one', 'def'], ['two', 'abc'], ['two', 'def'],]
         .forEach((path) => context.file(path[0], path[1], `${ path[1] }\n${ path[1] }`));

      expect(await git.clean([CleanOptions.DRY_RUN])).toEqual(expect.objectContaining({
         files: ['un-tracked.ccc'],
         folders: [],
      }));

      expect(await git.clean([CleanOptions.DRY_RUN], ['-d'])).toEqual(expect.objectContaining({
         files: ['un-tracked.ccc'],
         folders: ['one/', 'two/'],
      }));
   });

});
