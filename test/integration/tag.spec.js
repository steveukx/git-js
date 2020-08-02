const {createTestContext, setUpInit} = require('../helpers');

describe('tag', () => {

   let context;

   beforeEach(async () => {
      context = createTestContext();
      await setUpInit(context);

      const git = context.gitP(context.root);
      await context.fileP('foo', 'bar', 'content');
      await git.add('foo/*');
      await git.commit('message');
   });

   it('creates a named tag without the need for a callback', () => {
      const {git, gitP, root} = context;

      git(root).addTag('newTag');

      return new Promise((done) => {
         setTimeout(() => {
            gitP(root)
               .tag()
               .then(tags => {
                  expect(String(tags).trim()).toEqual('newTag');
                  done()
               })
               .catch(e => {
                  throw e;
               });

         }, 250);

      });
   });

   it('returns the tag name when adding a tag', async () => {
      const {gitP, root} = context;
      const addedTag = await gitP(root).addTag('newTag');

      expect(addedTag).toEqual({name: 'newTag'});
   });

});
