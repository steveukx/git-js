import { SimpleGit } from 'typings';
import { assertExecutedCommands, closeWithSuccess, like, newSimpleGit } from './__fixtures__';
import { GitConfigScope } from '../..';
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

   it.each([
      ['system', '--system'],
      ['global', '--global'],
      ['local', '--local'],
      ['worktree', '--worktree'],
      ['blah', '--local'],
      [GitConfigScope.global, '--global'],
   ])('allows custom scope scope: %s', async (scope, expected) => {
      git.addConfig('key', 'value', false, scope as GitConfigScope);
      await closeWithSuccess();

      assertExecutedCommands('config', expected, 'key', 'value');
   });

   it('lists', async () => {
      const queue = git.listConfig();
      await closeWithSuccess(`file:/Users/me/.gitconfig\0user.email
steve@mydev.co\0file:/Users/me/.gitconfig\0init.defaultbranch
main\0file:.git/config\0core.bare
false\0file:.git/config\0user.email
custom@mydev.co\0`);

      assertExecutedCommands('config', '--list', '--show-origin', '--null')
      expect(await queue).toEqual(like({
         files: [
            '/Users/me/.gitconfig',
            '.git/config',
         ],
         all: {
            'user.email': 'custom@mydev.co',
            'init.defaultbranch': 'main',
            'core.bare': 'false',
         },
         values: {
            '/Users/me/.gitconfig': {
               'user.email': 'steve@mydev.co',
               'init.defaultbranch': 'main',
            },
            '.git/config': {
               'user.email': 'custom@mydev.co',
               'core.bare': 'false',
            },
         }
      }))
   });

   it('lists with string scope', async () => {
      git.listConfig('local');
      await closeWithSuccess();

      assertExecutedCommands('config', '--list', '--show-origin', '--null', '--local');
   });

   it('lists with scope', async () => {
      git.listConfig(GitConfigScope.system);
      await closeWithSuccess();

      assertExecutedCommands('config', '--list', '--show-origin', '--null', '--system');
   });

});
