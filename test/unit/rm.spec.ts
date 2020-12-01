import { assertExecutedCommands, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';

const {closeWithSuccess, restore} = require('./include/setup');

describe('rm', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });
   afterEach(() => restore());

   it('remove single file', async () => {
      git.rm('string', callback);
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'string');
   });

   it('remove multiple files', async () => {
      git.rm(['foo', 'bar'], callback);
      await closeWithSuccess();
      assertExecutedCommands('rm', '-f', 'foo', 'bar');
   });
});
