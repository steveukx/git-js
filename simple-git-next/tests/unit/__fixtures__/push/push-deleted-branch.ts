import { createFixture } from '../create-fixture';

const stdOut = `
To github.com:kwsites/mock-repo.git
-       :refs/heads/feature/something     [deleted]
Done
`;
const stdErr = `
Pushing to git@github.com:kwsites/mock-repo.git
updating local tracking ref 'refs/remotes/origin/feature/something'
`;

export const pushDeletedBranch = createFixture(stdOut, stdErr);
