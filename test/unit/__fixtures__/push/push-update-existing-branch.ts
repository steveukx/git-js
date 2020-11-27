import { createFixture } from '../create-fixture';

const stdErr = `Pushing to git@github.com:kwsites/mock-repo.git
updating local tracking ref 'refs/remotes/origin/master'
To github.com:kwsites/mock-repo.git
        refs/heads/master:refs/heads/master     7259553..5a2ba71
Done`;
const stdOut = `To github.com:kwsites/mock-repo.git
        refs/heads/master:refs/heads/master     7259553..5a2ba71
Done`;

export const pushUpdateExistingBranch = createFixture(stdOut, stdErr);
