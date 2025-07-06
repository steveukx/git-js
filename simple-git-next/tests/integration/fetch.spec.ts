import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

describe('fetch', () => {
   let context: SimpleGitTestContext;
   let upstream: string;
   let local: string;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      upstream = await context.dir('upstream');
      local = context.path('local');
      await context.file(['upstream', 'file']);

      await givenRemote(upstream);
      await givenLocal(upstream, local);
   });

   it('fetches updates', async () => {
      const git = newSimpleGit(local);
      const bravoPriorHead = await git.revparse('origin/bravo');
      await givenRemoteChanges(upstream);

      const result = await git.fetch(['--prune']);

      const bravoCurrentHead = await git.revparse('origin/bravo');

      expect(result).toEqual({
         branches: [
            {
               name: 'delta',
               tracking: 'origin/delta',
            },
         ],
         deleted: [{ tracking: 'origin/charlie' }],
         raw: '',
         remote: upstream,
         tags: [
            {
               name: 'alpha',
               tracking: 'alpha',
            },
         ],
         updated: [
            {
               from: bravoPriorHead.substring(0, 7),
               name: 'bravo',
               to: bravoCurrentHead.substring(0, 7),
               tracking: 'origin/bravo',
            },
         ],
      });
   });

   /**
    * Sets up the repo to be used as a local - by cloning the remote
    */
   async function givenLocal(upstream: string, local: string) {
      await newSimpleGit(context.root).clone(upstream, local);
      await setUpInit({ git: newSimpleGit(local) });
   }

   /**
    * Sets up the repo to be used as a remote
    */
   async function givenRemote(upstream: string) {
      const git = newSimpleGit(upstream);
      await setUpInit({ git });
      await git.add('.');
      await git.commit('first');
      await git.raw('checkout', '-b', 'bravo');
      await git.raw('checkout', '-b', 'charlie');
   }

   /**
    * Configure the remote with changes to be retrieved when using fetch on the local
    */
   async function givenRemoteChanges(upstream: string) {
      const git = newSimpleGit(upstream);
      await git.raw('tag', 'alpha');
      await git.raw('checkout', 'bravo');
      await context.file(['upstream', 'another-file']);
      await git.add('.');
      await git.commit('second');
      await git.raw('checkout', '-b', 'delta');
      await git.raw('branch', '-d', 'charlie');
   }
});
