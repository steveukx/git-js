// TODO: deprecation warning
console.warn(`=============================================
simple-git has supported promises / async await since version 2.6.0.
 Importing from 'simple-git/promise' has been deprecated and will be
 removed by July 2022.

To upgrade, change all 'simple-git/promise' imports to just 'simple-git'
=============================================`);

const simpleGit = require('.');

module.exports = Object.assign(
   function () { return simpleGit.gitP.apply(null, arguments) },
   simpleGit,
   { default: simpleGit.gitP },
);
