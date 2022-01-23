import { promiseError } from '@kwsites/promise-result';
import { GitResponseError, PullFailedResult } from '../../typings';
import { createTestContext, like, newSimpleGit, setUpGitUser, setUpInit, SimpleGitTestContext } from '../__fixtures__';

describe('pull --ff-only', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());
   beforeEach(async () => {
      const upstream = await context.dir('upstream');
      const local = context.path('local');
      await context.file(['upstream', 'file']);

      await givenRemote(upstream);
      await givenLocal(upstream, local);
   });

   async function givenLocal(upstream: string, local: string) {
      console.log('givenLocal: cloning')
      await newSimpleGit(context.root).clone(upstream, local);

      console.log('givenLocal: setUpGitUser')
      await setUpGitUser({git: newSimpleGit(local)});
   }

   async function givenRemote(upstream: string) {
      const git = newSimpleGit(upstream);

      console.log('givenRemote: setUpInit');
      await setUpInit({git});

      console.log('givenRemote: add');
      await git.add('.');

      console.log('givenRemote: commit');
      await git.commit('first');
   }

   async function givenRemoteFileChanged() {
      await context.file(['upstream', 'file'], 'new remote file content');
      await newSimpleGit(context.path('upstream')).add('.').commit('remote updated');
   }

   async function givenLocalFileChanged() {
      await context.file(['local', 'file'], 'new local file content');
      await newSimpleGit(context.path('local')).add('.').commit('local updated');
   }

   it('allows fast-forward when there are no changes local or remote', async () => {
      const git = newSimpleGit(context.path('local'));
      const result = await git.pull(['--ff-only']);

      expect(result.files).toEqual([]);
   });

   it('allows fast-forward when there are some remote but no local changes', async () => {
      await givenRemoteFileChanged();

      const git = newSimpleGit(context.path('local'));
      const result = await git.pull(['--ff-only']);

      expect(result.files).toEqual(['file']);
   });

   it('allows fast-forward when there are no remote but some local changes', async () => {
      await givenLocalFileChanged();

      const git = newSimpleGit(context.path('local'));
      const result = await git.pull(['--ff-only']);

      expect(result.files).toEqual([]);
   });

   it('fails fast-forward when there are both remote and local changes', async () => {
      await givenLocalFileChanged();
      await givenRemoteFileChanged();

      const git = newSimpleGit(context.path('local'));
      const err = await promiseError<GitResponseError<PullFailedResult>>(git.pull(['--ff-only']));

      expect(err?.git.message).toMatch('Not possible to fast-forward, aborting');
      expect(err?.git).toEqual(like({
         remote: context.path('upstream'),
         hash: {
            local: expect.any(String),
            remote: expect.any(String),
         },
         branch: {
            local: expect.any(String),
            remote: expect.any(String),
         },
         message: String(err?.git),
      }))
   });

});
