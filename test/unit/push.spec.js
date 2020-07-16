const {closeWithSuccess, newSimpleGit, restore, theCommandRun} = require('./include/setup');
const {parsePush} = require('../../src/lib/responses/PushSummary');
const {pushNewBranch, pushNewBranchWithTags, pushNewBranchWithVulnerabilities, pushUpdateExistingBranch} = require('./__fixtures__/push-responses');

describe('push', () => {

   describe('usage', () => {
      let git;
      const defaultCommands = ['--verbose', '--porcelain'];
      beforeEach(() => git = newSimpleGit());
      afterEach(() => restore());

      describe('pushTags', () => {

         it('with remote', async () => {
            git.pushTags('foo');
            await closeWithSuccess();

            expect(theCommandRun()).toEqual(['push', 'foo', '--tags', ...defaultCommands]);
         });

         it('without remote', async () => {
            git.pushTags();
            await closeWithSuccess();

            expect(theCommandRun()).toEqual(['push', '--tags', ...defaultCommands]);
         });

         it('without remote with options', async () => {
            git.pushTags(['--blah', '--tags']);
            await closeWithSuccess();

            expect(theCommandRun()).toEqual(['push', '--blah', '--tags', ...defaultCommands]);
         });

      })

      it('git push can set multiple options', async () => {
         git.push(['foo', 'bar']);
         await closeWithSuccess();

         expect(theCommandRun()).toEqual(['push', 'foo', 'bar', ...defaultCommands]);
      });

      it('git push can set branch and remote', async () => {
         git.push('rrr', 'bbb');
         await closeWithSuccess();

         expect(theCommandRun()).toEqual(['push', 'rrr', 'bbb', ...defaultCommands]);
      });

      it('git push can run with no arguments', async () => {
         git.push();
         await closeWithSuccess();

         expect(theCommandRun()).toEqual(['push', ...defaultCommands]);
      });

      it('git push with options', async () => {
         git.push({'--follow-tags': null});
         await closeWithSuccess();

         expect(theCommandRun()).toEqual(['push', '--follow-tags', ...defaultCommands]);
      });

      it('git push with remote/branch and options', async () => {
         git.push('rrr', 'bbb', {'--follow-tags': null});
         await closeWithSuccess();

         expect(theCommandRun()).toEqual(['push', 'rrr', 'bbb', '--follow-tags', ...defaultCommands]);
      });
   });

   describe('parsing', () => {

      let actual;
      const states = Object.freeze({
         newBranch: 'new branch',
         newTag: 'new tag',
         deleted: 'deleted',
         alreadyUpdated: 'up to date',
      });

      function aPushedBranch (local, remote, state = states.newBranch, branch = true) {
         return {
            local,
            remote,
            branch,
            tag: !branch,
            deleted: state === states.deleted,
            alreadyUpdated: state === states.alreadyUpdated,
            new: state === states.newBranch || state === states.newTag,
         }
      }

      function aPushedTag (local, remote, state = states.newTag) {
         return aPushedBranch(local, remote, state, false);
      }

      it('parses pushing tags as well as branches', () => {
         givenTheResponse(pushNewBranchWithTags);
         expect(actual).toEqual(expect.objectContaining({
            pushed: [
               aPushedTag('refs/tags/tag-one', 'refs/tags/tag-one', states.alreadyUpdated),
               aPushedBranch('refs/heads/new-branch-hhh', 'refs/heads/new-branch-hhh', states.newBranch),
               aPushedTag('refs/tags/tag-two', 'refs/tags/tag-two', states.newTag),
            ],
         }))
      });

      it('parses github reports of vulnerabilities', () => {
         givenTheResponse(pushNewBranchWithVulnerabilities);
         expect(actual).toEqual(expect.objectContaining({
            remoteMessages: {
               pullRequestUrl: 'https://github.com/kwsites/mock-repo/pull/new/new-branch-fff',
               vulnerabilities: {
                  count: 12,
                  summary: '12 moderate',
                  url: 'https://github.com/kwsites/mock-repo/network/alerts',
               }
            }
         }))
      });

      it('parses pushing a new branch', () => {
         givenTheResponse(pushNewBranch);
         expect(actual).toEqual({
            branch: {
               local: 'new-branch-name-here',
               remote: 'new-branch-name-here',
               remoteName: 'origin',
            },
            pushed: [aPushedBranch('refs/heads/new-branch-name-here', 'refs/heads/new-branch-name-here', states.newBranch)],
            repo: 'git@github.com:kwsites/mock-repo.git',
            ref: {
               local: 'refs/remotes/origin/new-branch-name-here',
            },
            remoteMessages: {
               pullRequestUrl: 'https://github.com/kwsites/mock-repo/pull/new/new-branch-name-here',
            },
         })
         ;
      });

      it('parses updating an existing branch', () => {
         givenTheResponse(pushUpdateExistingBranch);
         expect(actual).toEqual({
            repo: 'git@github.com:kwsites/mock-repo.git',
            ref: {
               local: 'refs/remotes/origin/master',
            },
            pushed: [],
            update: {
               head: {
                  local: 'refs/heads/master',
                  remote: 'refs/heads/master',
               },
               hash: {
                  from: '7259553',
                  to: '5a2ba71',
               }
            }
         });
      });

      function givenTheResponse ({stdErr, stdOut}) {
         return actual = parsePush(`${ stdErr }\n${ stdOut }`);
      }

   });

});
