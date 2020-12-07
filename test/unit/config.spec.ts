import { SimpleGit } from 'typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { configListParser } from '../../src/lib/responses/ConfigList';

describe('config list parser', () => {

   const NULL = '\0';
   const GLOBAL_FILE = '/Library/Developer/CommandLineTools/usr/share/git-core/gitconfig';
   const USER_FILE = '/Users/whoami/.gitconfig';

   it('parses global config', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'def', 'global-value-def'),
      ));

      expect(config.files).toEqual([GLOBAL_FILE]);
      expect(config.all).toEqual({abc: 'global-value-abc', def: 'global-value-def'});
   });

   it('parses global and user config', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'def', 'global-value-def'),
         listConfigLine(USER_FILE, 'abc', 'user-value-abc'),
      ));

      expect(config.files).toEqual([GLOBAL_FILE, USER_FILE]);
      expect(config.all).toEqual({abc: 'user-value-abc', def: 'global-value-def'});
   });

   it('parses multiple values', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-def'),
      ));

      expect(config.all).toEqual({abc: ['global-value-abc', 'global-value-def']});
   });

   function listConfigLine(file: string, key: string, value: string) {
      return `file:${file}${NULL}${key}\n${value}`;
   }

   function listConfigFile(...lines: string[]) {
      return lines.join(NULL);
   }
});

describe('config', () => {

   let git: SimpleGit;

   beforeEach(() => git = newSimpleGit());

   it('adds', () => new Promise<void>(done => {
      git.addConfig('user.name', 'test', function (err: null | Error) {
         expect(err).toBeNull();
         assertExecutedCommands('config', '--local', 'user.name', 'test');
         done();
      });

      closeWithSuccess();
   }));

   it('appends', () => new Promise<void>(done => {
      git.addConfig('user.name', 'test', true, function (err: null | Error) {
         expect(err).toBeNull();
         assertExecutedCommands('config', '--local', '--add', 'user.name', 'test');
         done();
      });

      closeWithSuccess();
   }));

});
