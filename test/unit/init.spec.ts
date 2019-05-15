import expect from 'expect.js';
import { init } from '../../src/api/init';
import { mockContextWithResponse } from './include/mock.context';

describe('init', () => {

   let context: any;

   afterEach(() => {
      context = undefined;
   });

   it('as a regular repo in a new directory', async () => {
      context = mockContextWithResponse('Initialized empty Git repository in /some/path/.git/');

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/.git/');
      expect(response.existing).to.be(false);
      expect(context.exec.calledWith(
         ['init']
      ));
   });

   it('as a regular repo in an existing directory', async () => {
      context = mockContextWithResponse('Reinitialized existing Git repository in /some/path/.git/');

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/.git/');
      expect(response.existing).to.be(true);
      expect(context.exec.calledWith(
         ['init']
      ));
   });

   it('as a bare repo in a new directory', async () => {
      context = mockContextWithResponse('Initialized empty Git repository in /some/path/');

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/');
      expect(response.existing).to.be(false);
      expect(context.exec.calledWith(
         ['init', '--bare']
      ));
   });

   it('as a bare repo in an existing directory', async () => {
      context = mockContextWithResponse('Reinitialized existing Git repository in /some/path/');

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/');
      expect(response.existing).to.be(true);
      expect(context.exec.calledWith(
         ['init', '--bare']
      ));
   });

   it('works in context of outer queue builder', () => {
      expect(true).not.to.be(false);
   });

});
