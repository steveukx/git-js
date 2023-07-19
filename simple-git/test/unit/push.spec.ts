import { PushResult, SimpleGit } from '../../typings';
import { assertExecutedCommands, closeWithSuccess, like, newSimpleGit } from './__fixtures__';
import {
   pushNewBranch,
   pushNewBranchWithTags,
   pushUpdateExistingBranch,
} from './__fixtures__/push';
import { parsePushResult } from '../../src/lib/parsers/parse-push';

describe('push', () => {
   describe('usage', () => {
      let git: SimpleGit;
      const defaultCommands = ['--verbose', '--porcelain'];

      beforeEach(() => (git = newSimpleGit()));

      describe('pushTags', () => {
         it('with remote', async () => {
            git.pushTags('foo');
            await closeWithSuccess();

            assertExecutedCommands('push', 'foo', '--tags', ...defaultCommands);
         });

         it('without remote', async () => {
            git.pushTags();
            await closeWithSuccess();

            assertExecutedCommands('push', '--tags', ...defaultCommands);
         });

         it('without remote with options', async () => {
            git.pushTags(['--blah', '--tags']);
            await closeWithSuccess();

            assertExecutedCommands('push', '--blah', '--tags', ...defaultCommands);
         });
      });

      it('git push can set multiple options', async () => {
         git.push(['foo', 'bar']);
         await closeWithSuccess();

         assertExecutedCommands('push', 'foo', 'bar', ...defaultCommands);
      });

      it('git push can set branch and remote', async () => {
         git.push('rrr', 'bbb');
         await closeWithSuccess();

         assertExecutedCommands('push', 'rrr', 'bbb', ...defaultCommands);
      });

      it('git push can run with no arguments', async () => {
         git.push();
         await closeWithSuccess();

         assertExecutedCommands('push', ...defaultCommands);
      });

      it('git push with options', async () => {
         git.push({ '--follow-tags': null });
         await closeWithSuccess();

         assertExecutedCommands('push', '--follow-tags', ...defaultCommands);
      });

      it('git push with remote/branch and options', async () => {
         git.push('rrr', 'bbb', { '--follow-tags': null });
         await closeWithSuccess();

         assertExecutedCommands('push', 'rrr', 'bbb', '--follow-tags', ...defaultCommands);
      });
   });

   describe('parsing', () => {
      let actual: PushResult;
      const states = Object.freeze({
         newBranch: 'new branch',
         newTag: 'new tag',
         deleted: 'deleted',
         alreadyUpdated: 'up to date',
      });

      function aPushedBranch(
         local: string,
         remote: string,
         state = states.newBranch,
         branch = true
      ) {
         return {
            local,
            remote,
            branch,
            tag: !branch,
            deleted: state === states.deleted,
            alreadyUpdated: state === states.alreadyUpdated,
            new: state === states.newBranch || state === states.newTag,
         };
      }

      function aPushedTag(local: string, remote: string, state = states.newTag) {
         return aPushedBranch(local, remote, state, false);
      }

      it('will not match ill-formed push lines', () => {
         givenTheResponse({
            stdOut: [
               '*       refs/tags/tag-one:refs/tags/tag-one     [up to date]',
               '2       refs/tags/tag-one:refs/tags/tag-one     [up to date]',
               '=       refs/tags/tag-one:refs/tags/tag-one     [up to date]',
            ].join('\n'),
            stdErr: '',
         });

         expect(actual.pushed).toHaveLength(2);
      });

      it('parses pushing tags as well as branches', () => {
         givenTheResponse(pushNewBranchWithTags);
         expect(actual).toEqual(
            like({
               pushed: [
                  aPushedTag('refs/tags/tag-one', 'refs/tags/tag-one', states.alreadyUpdated),
                  aPushedBranch(
                     'refs/heads/new-branch-hhh',
                     'refs/heads/new-branch-hhh',
                     states.newBranch
                  ),
                  aPushedTag('refs/tags/tag-two', 'refs/tags/tag-two', states.newTag),
               ],
            })
         );
      });

      it('parses pushing a new branch', () => {
         givenTheResponse(pushNewBranch);
         expect(actual).toEqual(
            like({
               branch: {
                  local: 'new-branch-name-here',
                  remote: 'new-branch-name-here',
                  remoteName: 'origin',
               },
               pushed: [
                  aPushedBranch(
                     'refs/heads/new-branch-name-here',
                     'refs/heads/new-branch-name-here',
                     states.newBranch
                  ),
               ],
               repo: 'git@github.com:kwsites/mock-repo.git',
               ref: {
                  local: 'refs/remotes/origin/new-branch-name-here',
               },
            })
         );
      });

      it('parses updating an existing branch', () => {
         givenTheResponse(pushUpdateExistingBranch);
         expect(actual).toEqual(
            like({
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
                  },
               },
            })
         );
      });

      function givenTheResponse({ stdErr, stdOut }: { stdErr: string; stdOut: string }) {
         return (actual = parsePushResult(stdOut, stdErr));
      }
   });
});
