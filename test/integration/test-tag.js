'use strict';

const Test = require('./include/runner');

const setUp = (context) => {
   const repo = context.gitP(context.root);

   return repo.init()
      .then(() => context.file('foo', 'bar', 'content'))
      .then(() => repo.add('foo/*'))
      .then(() => repo.commit('message'));
};

describe('tag', () => {

   let context;

   beforeEach(() => setUp(context = Test.createContext()));

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
