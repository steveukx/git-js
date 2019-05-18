import expect from 'expect.js';

import { mockContextWithResponse } from './include/mock.context';
import { getRemotes } from '../../src/api';

describe('remote', () => {

   let context: any;

   afterEach(() => context = undefined);

   it('list remotes when there are none set up', async () => {
      context = mockContextWithResponse('');

      const result = await getRemotes(context, false);

      expect(result).to.eql([]);
   });

   it('get list', async () => {
      context = mockContextWithResponse(`
      origin
      upstream
      `);

      const result = await getRemotes(context, false);
      expect(result).to.eql([
         {name: 'origin', refs: {}},
         {name: 'upstream', refs: {}},
      ]);
   });

   it('get verbose list', async () => {
      context = mockContextWithResponse(`
        origin    s://u@d.com/u/repo.git (fetch)
        origin    s://u@d.com/u/repo.git (push)
        upstream  s://u@d.com/another/repo.git (fetch)
        upstream  s://u@d.com/another/repo.git (push)
      `);

      const result = await getRemotes(context, true);

      expect(context.exec.calledWith(['remote', '-v']));
      expect(result).to.eql([
         {name: 'origin', refs: {fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git'}},
         {name: 'upstream', refs: {fetch: 's://u@d.com/another/repo.git', push: 's://u@d.com/another/repo.git'}},
      ]);

   });

});
