const {assertExecutedCommands, like} = require('../helpers');
const {restore, newSimpleGit, closeWithSuccess} = require('./include/setup');

describe('clone', () => {
   let git;

   const cloneTests = [
      ['clone', 'with repo and local', ['repo', 'lcl'], ['clone', 'repo', 'lcl']],
      ['clone', 'with just repo', ['proto://remote.com/repo.git'], ['clone', 'proto://remote.com/repo.git']],
      ['clone', 'with options array', ['repo', 'lcl', ['foo', 'bar']], ['clone', 'foo', 'bar', 'repo', 'lcl']],
      ['clone', 'with options object', ['url', '.', {'--config': 'http.extraheader=AUTHORIZATION bearer xxxx'}], ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', 'url', '.']],
      ['clone', 'with array of options without local', ['repo', ['--config=http.extraheader=AUTHORIZATION bearer xxxx']], ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', 'repo']],
      ['mirror', 'explicitly set', ['r', 'l'], ['clone', '--mirror', 'r', 'l']],
   ];

   beforeEach(() => git = newSimpleGit());
   afterEach(() => restore());

   it.each(cloneTests)(`callbacks - %s %s`, async (api, name, cloneArgs, executedCommands) => {
      const callback = jest.fn();
      const queue = git[api](...cloneArgs, callback);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      expect(callback).toHaveBeenCalledWith(null, name);
      assertExecutedCommands(...executedCommands);
   });

   it.each(cloneTests)(`promises - %s %s`, async (api, name, cloneArgs, executedCommands) => {
      const queue = git[api](...cloneArgs);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      assertExecutedCommands(...executedCommands);
   });
});

