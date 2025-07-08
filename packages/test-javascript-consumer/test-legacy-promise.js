const { simpleGit, ResetMode } = require('simple-git/promise');
const { suite } = require('./suite');

(async () => {
   await suite('require named', simpleGit, ResetMode);
})();
