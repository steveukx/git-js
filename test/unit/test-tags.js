'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const TagList = require('../../src/responses/TagList');

var git, sandbox;

exports.setUp = function (done) {
   setup.restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   setup.restore();
   sandbox.restore();
   done();
};

exports.tags = {
   setUp: function (done) {
      git = setup.Instance();
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
         test.same(["tag", "-l"], setup.theCommandRun());
         test.equals('1.2.1', result.latest);
         test.same(['0.1.1', '1.1.1', '1.2.1'], result.all);

         test.done();
      });

      setup.closeWith('0.1.1\n\
        1.2.1\n\
        1.1.1\
        ');
   },

   'removes empty lines': function (test) {
      git.tags(function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(["tag", "-l"], setup.theCommandRun());
         test.equals('1.10.0', result.latest);
         test.same(['0.1.0', '0.2.0', '0.10.0', '0.10.1', '1.10.0', 'tagged'], result.all);

         test.done();
      });

      setup.closeWith('\n\
    0.1.0\n\
    0.10.0\n\
    0.10.1\n\
    0.2.0\n\
    1.10.0\n\
    tagged\n\
');
   }
};
