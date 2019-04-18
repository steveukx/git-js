'use strict';

const FS = require('fs');
const Test = require('./include/runner');

const setUp = (context) => {

   context.realRoot = context.dir('real-root');
   context.realSubRoot = context.dir('real-root/foo');
   context.fakeRoot = context.dir('fake-root');

   return context.gitP(context.realRoot).init();
};

module.exports = {
   'reports true for a real root': new Test(setUp, function (context, assert) {
      const expected = true;
      const git = context.gitP(context.realRoot);

      return git.checkIsRepo()
         .then((actual) => {
            assert.equals(actual, expected, 'Should be a repo');
         });

   }),

   'reports true for a child directory of a real root': new Test(setUp, function (context, assert) {
      const expected = true;
      const git = context.gitP(context.realSubRoot);

      return git.checkIsRepo()
         .then((actual) => {
            assert.equals(actual, expected, 'Should be a repo');
         });
   }),

   'reports false for a non-root': new Test(setUp, function (context, assert) {
      const expected = false;
      const git = context.gitP(context.fakeRoot);

      return git.checkIsRepo()
         .then((actual) => {
            assert.equals(actual, expected, 'Should be a repo');
         });
   }),
};
