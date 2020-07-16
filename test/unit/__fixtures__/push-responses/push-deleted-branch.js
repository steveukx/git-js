const stdout = `
To github.com:kwsites/mock-repo.git
-       :refs/heads/feature/something     [deleted]
Done
`;
const stderr = `
Pushing to git@github.com:kwsites/mock-repo.git
updating local tracking ref 'refs/remotes/origin/feature/something'
`;

module.exports = { stderr, stdout };
