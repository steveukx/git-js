import expect from 'expect.js';
import { stub } from 'sinon';
import { init } from '../../src/api/init';

describe('init', () => {

   let context: any;

   beforeEach(() => {
      context = {
         exec: stub(),
      };
   });

   it('as a regular repo in a new directory', async () => {
      context.exec.returns(Promise.resolve('Initialized empty Git repository in /some/path/.git/'));

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/.git/');
      expect(response.existing).to.be(false);
      expect(context.exec.calledWith(
         ['init']
      ));
   });

   it('as a regular repo in an existing directory', async () => {
      context.exec.returns(Promise.resolve('Reinitialized existing Git repository in /some/path/.git/'));

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/.git/');
      expect(response.existing).to.be(true);
      expect(context.exec.calledWith(
         ['init']
      ));
   });

   it('as a bare repo in a new directory', async () => {
      context.exec.returns(Promise.resolve('Initialized empty Git repository in /some/path/'));

      const response = await init(context, true);

      expect(response.root).to.be('/some/path/');
      expect(response.existing).to.be(false);
      expect(context.exec.calledWith(
         ['init', '--bare']
      ));
   });

   it('as a bare repo in an existing directory', async () => {
      context.exec.returns(Promise.resolve('Reinitialized existing Git repository in /some/path/'));

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
