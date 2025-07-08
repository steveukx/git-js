export const commitResultSingleFile = `

[foo 8f7d107] done
Author: Some Author <some@author.com>
1 files changed, 2 deletions(-)

      `;

export const commitResultNoneStaged = `
On branch master
        Your branch is ahead of 'origin/master' by 1 commit.
           (use "git push" to publish your local commits)

        Changes not staged for commit:
           modified:   src/some-file.js
           modified:   src/another-file.js
        no changes added to commit
        `;

export function commitToRepoRoot({
   message = 'Commit Message',
   hash = 'b13bdd8',
   fileName = 'file-name',
} = {}) {
   return `
[master (root-commit) ${hash}] ${message}
 1 file changed, 1 insertion(+)
 create mode 100644 ${fileName}
`;
}

export function commitToBranch({
   message = 'Commit Message',
   hash = 'b13bdd8',
   fileName = 'file-name',
   branch = 'branch',
} = {}) {
   return `
[${branch} ${hash}] ${message}
 1 file changed, 1 insertion(+)
 create mode 100644 ${fileName}
`;
}
