import { GitConfigScope } from '../..';
import type { SimpleGitCore } from '../../index';
import { configListParser } from '../../src/responses/ConfigList';
import { assertExecutedCommands, closeWithSuccess, like, newSimpleGit } from '../__fixtures__';

describe('config list parser', () => {
   const NULL = '\0';
   const GLOBAL_FILE = '/Library/Developer/CommandLineTools/usr/share/git-core/gitconfig';
   const USER_FILE = '/Users/whoami/.gitconfig';

   it('parses global config', () => {
      const config = configListParser(
         listConfigFile(
            listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
            listConfigLine(GLOBAL_FILE, 'def', 'global-value-def')
         )
      );

      expect(config.files).toEqual([GLOBAL_FILE]);
      expect(config.all).toEqual({ abc: 'global-value-abc', def: 'global-value-def' });
   });

   it('parses global and user config', () => {
      const config = configListParser(
         listConfigFile(
            listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
            listConfigLine(GLOBAL_FILE, 'def', 'global-value-def'),
            listConfigLine(USER_FILE, 'abc', 'user-value-abc')
         )
      );

      expect(config.files).toEqual([GLOBAL_FILE, USER_FILE]);
      expect(config.all).toEqual({ abc: 'user-value-abc', def: 'global-value-def' });
   });

   it('parses multiple values', () => {
      const config = configListParser(
         listConfigFile(
            listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
            listConfigLine(GLOBAL_FILE, 'abc', 'global-value-def')
         )
      );

      expect(config.all).toEqual({ abc: ['global-value-abc', 'global-value-def'] });
   });

   function listConfigLine(file: string, key: string, value: string) {
      return `file:${file}${NULL}${key}\n${value}`;
   }

   function listConfigFile(...lines: string[]) {
      return lines.join(NULL);
   }
});

describe('config', () => {
   let git: SimpleGitCore;

   // config writes are deny-by-default in @simple-git/core - these specs opt in
   // to the keys they exercise via allowConfigWrite (§2.7)
   beforeEach(() => (git = newSimpleGit({ allowConfigWrite: ['key'] })));

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

      assertExecutedCommands('config', '--list', '--show-origin', '--null');
      expect(await queue).toEqual(
         like({
            files: ['/Users/me/.gitconfig', '.git/config'],
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
            },
         })
      );
   });

   it('lists with string scope', async () => {
      git.listConfig('local' as GitConfigScope);
      await closeWithSuccess();

      assertExecutedCommands('config', '--list', '--show-origin', '--null', '--local');
   });

   it('lists with scope', async () => {
      git.listConfig(GitConfigScope.system);
      await closeWithSuccess();

      assertExecutedCommands('config', '--list', '--show-origin', '--null', '--system');
   });

   describe('getConfig', () => {
      it('exposes all values split by scope', async () => {
         const task = git.getConfig('some.prop');
         await closeWithSuccess(
            'file:.git/blah\0some.prop\nvalue\0file:.git/config\0some.prop\nvalue1\0file:.git/config\0some.prop\nvalue2\0'
         );
         const { scopes } = await task;

         expect(scopes).toEqual(
            new Map([
               ['.git/blah', ['value']],
               ['.git/config', ['value1', 'value2']],
            ])
         );
      });

      it('ignores properties with mismatched key', async () => {
         const task = git.getConfig('some.prop');
         await closeWithSuccess(
            'file:.git/blah\0other.prop\nvalue\0file:.git/config\0some.prop\nvalue1\0file:.git/config\0other.prop\nvalue2\0'
         );
         const { value, values, scopes } = await task;

         expect(value).toBe('value1');
         expect(values).toEqual(['value1']);
         expect(scopes).toEqual(new Map([['.git/config', ['value1']]]));
      });

      it('gets a single item', async () => {
         const task = git.getConfig('foo');
         await closeWithSuccess(`file:/Users/me/.gitconfig\0foo
bar\0file:.git/config\0foo
baz\0`);

         expect(await task).toEqual(
            like({
               key: 'foo',
               value: 'baz',
               values: ['bar', 'baz'],
               paths: ['/Users/me/.gitconfig', '.git/config'],
            })
         );
         assertExecutedCommands('config', '--null', '--show-origin', '--get-all', 'foo');
      });

      it('gets a single item in a specific scope', async () => {
         const task = git.getConfig('user.email', 'local' as GitConfigScope);
         await closeWithSuccess(`file:.git/config\0user.email
another@mydev.co\0file:.git/config\0user.email
final@mydev.co\0`);

         expect(await task).toEqual(
            like({
               value: 'final@mydev.co',
               values: ['another@mydev.co', 'final@mydev.co'],
               paths: ['.git/config'],
            })
         );
         assertExecutedCommands(
            'config',
            '--local',
            '--null',
            '--show-origin',
            '--get-all',
            'user.email'
         );
      });
   });
});
