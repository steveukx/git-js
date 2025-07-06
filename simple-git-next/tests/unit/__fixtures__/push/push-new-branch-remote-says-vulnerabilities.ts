import { gitHubAlertsUrl, gitHubPullRequest } from './constants';
import { createFixture } from '../create-fixture';

const stdErr = `Pushing to git@github.com:kwsites/mock-repo.git
remote:
remote: Create a pull request for 'new-branch-fff' on GitHub by visiting:
remote:      ${gitHubPullRequest}
remote:
remote: GitHub found 12 vulnerabilities on kwsites/mock-repo's default branch (12 moderate). To find out more, visit:
remote:      ${gitHubAlertsUrl}
remote:
updating local tracking ref 'refs/remotes/origin/new-branch-fff'`;
const stdOut = `To github.com:kwsites/mock-repo.git
*       refs/heads/features/some-branch:refs/heads/features/some-branch     [new branch]
Branch 'features/some-branch' set up to track remote branch 'features/some-branch' from 'origin'.
Done`;

export const pushNewBranchWithVulnerabilities = createFixture(stdOut, stdErr);
