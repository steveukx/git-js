const simpleGit = require('simple-git');
const {suite} = require('./suite');

(async () => {
   await suite('require default', simpleGit, simpleGit.ResetMode);
})();

