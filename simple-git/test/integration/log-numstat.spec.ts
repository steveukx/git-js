import { promiseError } from '@kwsites/promise-result';
import { newSimpleGit } from '@simple-git/test-utils';

describe('log-numstat', function () {
   it('custom format and date range should not fail when also setting numstat', async () => {
      const ac = new AbortController();
      const log = newSimpleGit(__dirname, {
         abort: ac.signal,
      }).log({
         'format': {
            H: '%H',
            h: '%h',
            P: '%P',
            p: '%p',
            aI: '%aI',
            s: '%s',
            D: '%D',
            b: '%b',
            an: '%an',
            ae: '%ae',
         },
         '--all': null,
         '--since': '2024-02-04',
         '--numstat': null,
      });

      setTimeout(() => ac.abort(), 500);

      expect(await promiseError(log)).toBeUndefined();
   });
});
