import { gitLabPullRequest } from './constants';
import { createFixture } from '../create-fixture';

const stdOut = `To github.com:kwsites/mock-repo.git
*       refs/heads/new-branch-name-here:refs/heads/new-branch-name-here     [new branch]
Branch 'new-branch-name-here' set up to track remote branch 'new-branch-name-here' from 'origin'.
Done`;

const stdErr = `Pushing to git@github.com:kwsites/mock-repo.git
remote:
remote: To create a merge request for new-branch-name-here, visit:
remote:      ${gitLabPullRequest}
remote:
updating local tracking ref 'refs/remotes/origin/new-branch-name-here'`;

export const pushNewBranch = createFixture(stdOut, stdErr);
