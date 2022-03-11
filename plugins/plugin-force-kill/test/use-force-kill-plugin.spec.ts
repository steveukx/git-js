import simpleGit from 'simple-git';
import { forceKillPlugin } from '@simple-git/plugin-force-kill';

describe('use-force-kill', () => {

   it('poop', async () => {
      const ac = new AbortController();
      const abort = jest.fn().mockReturnValue(ac.signal);

      const statuses = await Promise.race([
         simpleGit({plugins: [forceKillPlugin({abort})]}).status(handler(1)),
         simpleGit({plugins: [forceKillPlugin({abort})]}).status(handler(2)),
         simpleGit({plugins: [forceKillPlugin({abort})]}).status(handler(3)),
      ]);
      ac.abort();

      debugger;

      expect(statuses).not.toBeNull();
   });

   function handler(prefix) {
      return function (err, data) {
         err ? console.log(`ERR${prefix}`, err) : console.log(`STATUS${prefix}`, data);
      }
   }
});
