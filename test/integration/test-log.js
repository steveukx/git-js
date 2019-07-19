'use strict';

const Test = require('./include/runner');

const setUp = (context) => {

   const repo = context.gitP(context.root);
   return repo
      .init()
      .then(() => context.file('src', 'a.txt', 'fie content'))
      .then(() => repo.add('src/a.txt'))
      .then(() => repo.commit('commit line one\ncommit line two\n'))
      .then(() => context.file('src', 'b.txt', 'fie content'))
      .then(() => repo.add('src/b.txt'))
      .then(() => repo.commit('commit on one line'))
      .then((commit) => context.commit = commit)
      .then(() => repo.raw(['config', 'user.name']).then(data => context.$userName = data.trim()))
      .then(() => repo.raw(['config', 'user.email']).then(data => context.$userEmail = data.trim()))
      ;
};

module.exports = {
   'multi-line commit message in log summary': new Test(setUp, (context, assert) => {
      return context
         .gitP(context.root)
         .log({multiLine: true})
         .then((actual) => {
            assert.same(actual.latest, actual.all[0]);
            assert.same(actual.latest.refs, 'HEAD -> master');
            assert.same(actual.latest.body, 'commit on one line\n');
            assert.same(actual.latest.author_name, context.$userName);
            assert.same(actual.latest.author_email, context.$userEmail);
         });
      }
   ),

   'multi-line commit message in custom format log summary': new Test(setUp, (context, assert) => {
      return context
         .gitP(context.root)
         .log({
            format: {refs: '%D', body: '%B', message: '%s'},
            splitter: '||'
         })
         .then((actual) => {
            assert.deepEqual(actual.all[0], {
               body: 'commit on one line\n',
               refs: 'HEAD -> master',
               message: 'commit on one line',
            });
            assert.deepEqual(actual.all[1], {
               body: 'commit line one\ncommit line two\n',
               refs: '',
               message: 'commit line one commit line two',
            });
         });
      }
   ),

   'should read one line for each commit when using shortstat': new Test(setUp, (context, assert) => {
      return context
         .gitP(context.root)
         .log(['--shortstat'])
         .then((actual) => {
            assert.equal(actual.all.length, 2);
         });
      }
   )
};
