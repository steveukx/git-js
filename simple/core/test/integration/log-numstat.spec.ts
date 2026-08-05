import { promiseError } from '@kwsites/promise-result';

import { newSimpleGit } from '../__fixtures__/integration';

describe('log-numstat', () => {
   it('custom format and date range should not fail when also setting numstat', async () => {
      const log = newSimpleGit(__dirname).log({
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
         '--since': '2026-01-01',
         '--numstat': null,
      });

      expect(await promiseError(log)).toBeUndefined();
   });
});
