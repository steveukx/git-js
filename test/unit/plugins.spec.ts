import { SimpleGit } from '../../typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('plugins', () => {

   let git: SimpleGit;

   it('allows configuration prefixing', async () => {
      git = newSimpleGit({ config: ['a', 'bcd'] });
      git.raw('foo');

      await closeWithSuccess();
      assertExecutedCommands('-c', 'a', '-c', 'bcd', 'foo');
   })

})
