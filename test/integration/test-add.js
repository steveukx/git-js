'use strict';

const Test = require('./include/runner');

const setUp = (context) => (context.repo = context.gitP(context.root)).init();

module.exports = {

   'adds a single file': new Test(setUp, async (context, assert) => {
      context.file('src', 'file.txt', 'file content');

      await context.repo.add('src/file.txt');
      const status = await context.repo.status();

      assert.same(status.created, ['src/file.txt']);
      assert.same(status.files.length, 1);

   }),

   'adds a all files': new Test(setUp, async (context, assert) => {
      context.file('src', 'a.txt', 'aaa content');
      context.file('src', 'b.txt', 'bbb content');

      await context.repo.add('*');
      const status = await context.repo.status();

      assert(status.created).same(['src/a.txt', 'src/b.txt']);
      assert(status.files.length).same(2);

   }),

};
