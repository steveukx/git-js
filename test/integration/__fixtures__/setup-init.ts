import { SimpleGitTestContext } from './create-test-context';
import { SimpleGit } from '../../../typings';

export async function setUpInit ({git}: SimpleGitTestContext, bare = false) {
   await git.init(bare);
   await configureGitCommitter(git);
}

async function configureGitCommitter (git: SimpleGit, name = 'Simple Git Tests', email = 'tests@simple-git.dev') {
   await git.addConfig('user.name', name);
   await git.addConfig('user.email', email);
}
