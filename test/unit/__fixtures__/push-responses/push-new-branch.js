const stdErr = `Pushing to git@github.com:kwsites/mock-repo.git
remote:
remote: To create a merge request for new-branch-name-here, visit:
remote:      https://gitlab/kwsites/mock-repo/-/merge_requests/new?merge_request%5Bsource_branch%5D=new-branch-name-here
remote:
updating local tracking ref 'refs/remotes/origin/new-branch-name-here'`;
const stdOut = `To github.com:kwsites/mock-repo.git
*       refs/heads/new-branch-name-here:refs/heads/new-branch-name-here     [new branch]
Branch 'new-branch-name-here' set up to track remote branch 'new-branch-name-here' from 'origin'.
Done`;
module.exports = { stdErr, stdOut };
