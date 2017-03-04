'use strict';

/*

 */
const Test = require('./include/runner');
const FS = require('fs');
const sinon = require('sinon');

const setUp = (context) => {
   return Promise.resolve();
};

const test = (context, assert) => {

   let validWorkingDirectory = `${context.root}/good`;
   let invalidWorkingDirectory = `${context.root}/bad`;

   FS.mkdirSync(validWorkingDirectory);

   const spies = [
      sinon.spy(),
      sinon.spy(),
      sinon.spy()
   ];

   context.git(context.root)
      .silent(true)
      .cwd(validWorkingDirectory, spies[0])
      .cwd(invalidWorkingDirectory, spies[1])
      .cwd(validWorkingDirectory, spies[2]);

   return new Promise((pass) => {
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
