// TODO: deprecation warning
const simpleGit = require('.');

module.exports = Object.assign(
   function () { return simpleGit.gitP.apply(null, arguments) },
   simpleGit,
   { default: simpleGit.gitP },
);
