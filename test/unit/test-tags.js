
const jestify = require('../jestify');
const {theCommandRun, restore, Instance, instanceP, closeWith, closeWithP} = require('./include/setup');
const sinon = require('sinon');
const TagList = require('../../src/responses/TagList');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.tagP = {
   setUp (done) {
      git = instanceP(sandbox);
      done();
   },

   async 'tag with options array' (test) {
      closeWithP('');
      await git.tag(['-a', 'new-tag-name', '-m', 'commit message', 'cbb6fb8']);

      test.same(['tag', '-a', 'new-tag-name', '-m', 'commit message', 'cbb6fb8'], theCommandRun());
      test.done();
   },

   async 'tag with options object' (test) {
      closeWithP('');
      await git.tag({
         '--annotate': null,
         'some-new-tag': null,
         '--message': 'commit message',
         'cbb6fb8': null
      });

      test.same(['tag', '--annotate', 'some-new-tag', '--message=commit message', 'cbb6fb8'], theCommandRun());
      test.done();
   }
};

exports.tags = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'with a character prefix': function (test) {
      var tagList = TagList.parse('v1.0.0 \n v0.0.1 \n v0.6.2');

      test.equals('v1.0.0', tagList.latest);
      test.same(['v0.0.1', 'v0.6.2', 'v1.0.0'], tagList.all);

      test.done();
   },


   'with a character prefix and different lengths': function (test) {
      var tagList = TagList.parse('v1.0 \n v1.0.1');

      test.equals('v1.0.1', tagList.latest);
      test.same(['v1.0', 'v1.0.1'], tagList.all);

      test.done();
   },

   'with max count shorthand property': function (test) {
      git.tags(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["tag", "-l"], theCommandRun());
         test.equals('1.2.1', result.latest);
         test.same(['0.1.1', '1.1.1', '1.2.1'], result.all);

         test.done();
      });

      closeWith('0.1.1\n\
        1.2.1\n\
        1.1.1\
        ');
   },

   'removes empty lines': function (test) {
      git.tags(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["tag", "-l"], theCommandRun());
         test.equals('1.10.0', result.latest);
         test.same(['0.1.0', '0.2.0', '0.10.0', '0.10.1', '1.10.0', 'tagged'], result.all);

         test.done();
      });

      closeWith(`
    0.1.0
    0.10.0
    0.10.1

    0.2.0

    1.10.0

    tagged
`);
   },

   'respects a custom sort order': function (test) {
      git.tags({'--sort': 'foo'}, function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["tag", "-l", "--sort=foo"], theCommandRun());
         test.equals('aaa', result.latest);
         test.same(['aaa', '0.10.0', '0.2.0', 'bbb'], result.all);

         test.done();
      });

      closeWith('\n\
    aaa\n\
    0.10.0\n\
    0.2.0\n\
    bbb\n\
');
   }
};

jestify(exports);
