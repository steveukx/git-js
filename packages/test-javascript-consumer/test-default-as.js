const {default: simpleGit, ResetMode} = require('simple-git');
const {suite} = require('./suite');

(async () => {
   await suite('require default-as', simpleGit, ResetMode);
})();
