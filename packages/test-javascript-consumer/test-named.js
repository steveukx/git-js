const {simpleGit, ResetMode} = require('simple-git');
const {suite} = require('./suite');

(async () => {
   await suite('require named', simpleGit, ResetMode);
})();

