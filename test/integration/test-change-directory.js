'use strict';

/*

 */

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

var Test = require('./include/runner');
var FS = require('fs');
var sinon = require('sinon');

var setUp = function setUp(context) {
   return _Promise.resolve();
};

var test = function test(context, assert) {

   var validWorkingDirectory = context.root + '/good';
   var invalidWorkingDirectory = context.root + '/bad';

   FS.mkdirSync(validWorkingDirectory);

   var spies = [sinon.spy(), sinon.spy(), sinon.spy()];

   context.git(context.root).silent(true).cwd(validWorkingDirectory, spies[0]).cwd(invalidWorkingDirectory, spies[1]).cwd(validWorkingDirectory, spies[2]);

   return new _Promise(function (pass) {
      setTimeout(function () {
         assert.ok(spies[0].calledWith(null, validWorkingDirectory), 'Change to valid directory is ok');
         assert.ok(spies[1].calledWith(sinon.match.instanceOf(Error)), 'Change to invalid directory is error');
         assert.ok(spies[2].notCalled, 'After an error no more steps are processed');

         pass();
      }, 250);
   });
};

module.exports = {
   'switches into new directory': new Test(setUp, test)
};