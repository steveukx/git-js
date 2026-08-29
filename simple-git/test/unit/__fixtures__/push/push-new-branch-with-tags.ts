import { createFixture } from '../create-fixture';

const stdErr = `Pushing to git@github.com:kwsites/mock-repo.git
updating local tracking ref 'refs/remotes/origin/new-branch-hhh'`;
const stdOut = `To github.com:kwsites/mock-repo.git
=       refs/tags/tag-one:refs/tags/tag-one     [up to date]
*       refs/heads/new-branch-hhh:refs/heads/new-branch-hhh     [new branch]
*       refs/tags/tag-two:refs/tags/tag-two     [new tag]
Branch 'new-branch-hhh' set up to track remote branch 'new-branch-hhh' from 'origin'.
Done`;

export const pushNewBranchWithTags = createFixture(stdOut, stdErr);
