import expect from 'expect.js';
import { mockContextWithResponse } from './include/mock.context';
import { SinonSpy, stub } from 'sinon';
import { add } from '../../src/api';
import { ContextModel } from '../../src/util/context';
import { Git } from '../../src/git';
import { AddResponse } from '../../src/responses';

describe('add', () => {

   let context: any;

   afterEach(() => {
      context = undefined;
   });

   it('adds a single file', async () => {
      context = mockContextWithResponse(`add 'foo'`);

      const response = await add(context, ['foo']);

      expect(response.added).to.eql(['foo']);
      expect(context.exec.calledWith(
         ['add', '-v', 'foo']
      ));
   });

   it('works in context of outer queue builder', async () => {
      const contextModel = new ContextModel({
         exec: stub().resolves(''),
      });

      const git = new Git(contextModel);
      const result = await git.add('file');

      expect(result).to.be.an(AddResponse);
      expect((contextModel.exec as SinonSpy).calledWith(
         ['add', '-v', 'file']
      )).to.be(true);
   });

});
