const simpleGit = require('../../');
const {CleanResponse} = require('../../src/lib/responses/CleanSummary');
const Test = require('./include/runner');

describe('promises-from-root', () => {
   let context;

   beforeEach(() => context = Test.createContext())

   it('chains through the default export', async () => {
      const onInit = jest.fn();
      const onClean = jest.fn();
      const onError = jest.fn();

      const git = simpleGit(context.root);
      const queue = git.init()
         .then(onInit)
         .then(() => git.clean('f'))
         .then(onClean)
         .catch(err => console.error(err));

      await queue;
      expect(onInit).toHaveBeenCalled();
      expect(onClean).toHaveBeenCalledWith(expect.any(CleanResponse));
      expect(onError).not.toHaveBeenCalled();
   });

});
