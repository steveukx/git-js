'use strict';

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var FS = require('fs');

/*
   The broken chains test assures the behaviour of both standard and Promise wrapped versions
   of the simple-git library.

   Failures (exit code other than zero and some content in the stderr output) cause the current
   queue to be truncated and no additional steps to be taken.

   In the case of a promise chain, the `catch` handler should be called on the first error
   and no other steps in the chain be executed.
 */
var Test = require('./include/runner');

var setUp = function setUp(context) {
   var git = context.gitP(context.root);

   return context.gitP(context.root).init().then(function () {
      return git.checkout(['-b', 'first']);
   }).then(function () {
      FS.writeFileSync(context.root + '/aaa.aaa', 'Some\nFile content\nhere', 'utf8');
      FS.writeFileSync(context.root + '/bbb.bbb', Array.from({ length: 20 }, function () {
         return 'bbb';
      }).join('\n'), 'utf8');
   }).then(function () {
      return git.add([context.root + '/aaa.aaa', context.root + '/bbb.bbb']);
   }).then(function () {
      return git.commit('first commit');
   }).then(function () {
      return git.checkout(['-b', 'second', 'first']);
   }).then(function () {
      FS.writeFileSync(context.root + '/aaa.aaa', 'Different\nFile content\nhere', 'utf8');
      FS.writeFileSync(context.root + '/ccc.ccc', 'Another file', 'utf8');
   }).then(function () {
      return git.add([context.root + '/aaa.aaa', context.root + '/ccc.ccc']);
   }).then(function () {
      return git.commit('second commit');
   });
};

module.exports = {
   'single file conflict': new Test(setUp, function (context, assert) {
      var git = context.gitP(context.root);
      var result = context.deferred();

      _Promise.resolve().then(function () {
         return git.checkout('first');
      }).then(function () {
         FS.writeFileSync(context.root + '/aaa.aaa', 'Conflicting\nFile content\nhere', 'utf8');
      }).then(function () {
         return git.add([context.root + '/aaa.aaa']);
      }).then(function () {
         return git.commit('move first ahead of second');
      }).then(function () {
         return git.merge(['second']);
      }).then(function (res) {
         result.resolve(new Error('Should have had merge conflicts'));
      }).catch(function (err) {
         assert.equal(err.message, 'CONFLICTS: aaa.aaa:content');
         result.resolve();
      });

      return result.promise;
   }),

   'multiple files conflicted': new Test(setUp, function (context, assert) {
      var git = context.gitP(context.root);
      var result = context.deferred();

      _Promise.resolve().then(function () {
         return git.checkout('second');
      }).then(function () {
         FS.writeFileSync(context.root + '/bbb.bbb', Array.from({ length: 19 }, function () {
            return 'bbb';
         }).join('\n') + '\nBBB', 'utf8');
      }).then(function () {
         return git.add([context.root + '/bbb.bbb']);
      }).then(function () {
         return git.commit('move second ahead of first');
      }) // second is ahead with both files

         .then(function () {
            return git.checkout('first');
         }) // moves back in both files
         .then(function () {
            FS.writeFileSync(context.root + '/aaa.aaa', 'Conflicting\nFile content', 'utf8');
            FS.writeFileSync(context.root + '/bbb.bbb', 'BBB\n' + Array.from({ length: 19 }, function () {
               return 'bbb';
            }).join('\n'), 'utf8');
            FS.writeFileSync(context.root + '/ccc.ccc', 'Totally Conflicting', 'utf8');
         }).then(function () {
            return git.add([context.root + '/aaa.aaa', context.root + '/bbb.bbb', context.root + '/ccc.ccc']);
         }) // first ahead of second with conflicts on another
         .then(function () {
            return git.commit('move first ahead of second');
         }) // "another-file" modified in both
         .then(function () {
            return git.merge(['second']);
         }).then(function (res) {
            result.resolve(new Error('Should have had merge conflicts'));
         }).catch(function (err) {
            assert.equal(err.message, 'CONFLICTS: ccc.ccc:add/add, aaa.aaa:content');
            result.resolve();
         });

      return result.promise;
   }),

   'multiple files updated and merged': new Test(setUp, function (context, assert) {
      var git = context.gitP(context.root);
      var result = context.deferred();

      _Promise.resolve().then(function () {
         return git.checkout('first');
      }).then(function () {
         return git.merge(['second']);
      }).then(function (res) {
         assert.equal(res.failed, false);
         result.resolve();
      }).catch(function (err) {
         result.resolve(new Error('Should have no conflicts'));
      });

      return result.promise;
   })
};