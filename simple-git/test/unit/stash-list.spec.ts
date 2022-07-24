import { SimpleGit } from '../../typings';
import { assertExecutedCommands, closeWithSuccess, like, newSimpleGit } from './__fixtures__';
import {
   COMMIT_BOUNDARY,
   SPLITTER,
   START_BOUNDARY,
} from '../../src/lib/parsers/parse-list-log-summary';

describe('stashList', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('with no stash', async () => {
      const expected = like({
         total: 0,
         all: [],
      });
      const queue = git.stashList(callback);
      closeWithSuccess();

      expect(await queue).toEqual(expected);
      expect(callback).toHaveBeenCalledWith(null, expected);
   });

   it('commands - default', async () => {
      git.stashList();
      await closeWithSuccess();

      assertExecutedCommands(
         'stash',
         'list',
         `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`
      );
   });

   it('commands - custom splitter', async () => {
      const splitter = ';;';

      git.stashList({ splitter });
      await closeWithSuccess();

      assertExecutedCommands(
         'stash',
         'list',
         `--pretty=format:${START_BOUNDARY}%H${splitter}%aI${splitter}%s${splitter}%D${splitter}%b${splitter}%aN${splitter}%aE${COMMIT_BOUNDARY}`
      );
   });
});
