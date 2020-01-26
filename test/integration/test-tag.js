'use strict';

const Test = require('./include/runner');

const setUp = (context) => {
   const repo = context.gitP(context.root);

   return repo.init()
      .then(() => context.file('foo', 'bar', 'content'))
      .then(() => repo.add('foo/*'))
      .then(() => repo.commit('message'));
};

module.exports = {

   'creates a named tag without the need for a callback': new Test(setUp, (context, assert) => {
      const g = context.git(context.root);
      g.addTag('newTag');

      return new Promise(async (done) => {
         setTimeout(() => {
            context.gitP(context.root)
               .tag()
               .then(tags => {
                  assert.same(String(tags).trim(), 'newTag');
                  done()
               })
               .catch(e => {
                  done(e);
               });

         }, 250);

      });

   }),

};
