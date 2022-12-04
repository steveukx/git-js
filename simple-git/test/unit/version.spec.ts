import { closeWithError, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('version', () => {
   it('sringifies to version', async () => {
      const version = newSimpleGit().version();
      await closeWithSuccess('git version 2.50.10 (Apple Git-133)');

      expect(String(await version)).toBe('2.50.10');
   });

   it('detects missing', async () => {
      const version = newSimpleGit().version();
      await closeWithError('FAIL', -2);

      expect(await version).toEqual({
         installed: false,
         major: 0,
         minor: 0,
         patch: 0,
         agent: '',
      });
   });

   it('parses apple', async () => {
      const version = newSimpleGit().version();
      await closeWithSuccess('git version 2.32.1 (Apple Git-133)');

      expect(await version).toEqual({
         installed: true,
         major: 2,
         minor: 32,
         patch: 1,
         agent: 'Apple Git-133',
      });
   });

   it('parses git from source', async () => {
      const version = newSimpleGit().version();
      await closeWithSuccess('git version 2.37.GIT');

      expect(await version).toEqual({
         installed: true,
         major: 2,
         minor: 37,
         patch: 'GIT',
         agent: '',
      });
   });
});
