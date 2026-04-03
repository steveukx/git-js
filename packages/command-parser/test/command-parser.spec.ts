import { commandParser, pathspec } from '@simple-git/command-parser';

describe('commandParser', () => {

   it('debugs', () => {
      const p = commandParser([
         'commit',
         '--config', 'core.sshCommand=CMD1',
         '-c', 'core.sshCommand=CMD2',
         '--config-env=core.sshCommand=GIT_SSH_COMMAND',
         '-m', 'foo'
      ]);

      expect(p.task).toBe('commit');
   })

   it('parses a simple command', () => {
      const parsed = commandParser(['commit', '-m', 'foo']);

      expect(parsed).toEqual({
         args: ['-m', 'foo'],
         command: ['commit', '-m', 'foo'],
         config: {},
         configCommand: null,
         configEnv: {},
         pathspecs: [],
         prefix: [],
         separator: false,
         switches: [
            {
               argIndex: 1,
               combined: false,
               consumesNext: true,
               kind: 'command',
               name: '-m',
               raw: '-m',
               value: 'foo',
               valueIndex: 2,
            },
         ],
         task: 'commit',
      });
   });

   it('parses command scoped config', () => {
      const parsed = commandParser([
         'clone',
         '--config',
         'core.sshCommand=CMD',
         'git@github.com:foo/bar.git',
      ]);

      expect(parsed).toEqual({
         args: ['--config', 'core.sshCommand=CMD', 'git@github.com:foo/bar.git'],
         command: ['clone', '--config', 'core.sshCommand=CMD', 'git@github.com:foo/bar.git'],
         config: {
            'core.sshcommand': 'CMD',
         },
         configCommand: null,
         configEnv: {},
         pathspecs: [],
         prefix: [],
         separator: false,
         switches: [
            {
               argIndex: 1,
               combined: false,
               consumesNext: true,
               kind: 'command',
               name: '--config',
               raw: '--config',
               value: 'core.sshCommand=CMD',
               valueIndex: 2,
            },
         ],
         task: 'clone',
      });
   });

   it('parses joined short switches', () => {
      const parsed = commandParser(['-c', 'core.fsmonitor=touch ./pwn', 'status']);
   });

   it('preserves unknown clustered command switches', () => {
      const parsed = commandParser(['clone', '-nu', `sh -c "touch ./pwn"`, 'git@github.com:foo/bar.git']);

      expect(parsed).toEqual({
         args: ['-nu', `sh -c "touch ./pwn"`, 'git@github.com:foo/bar.git'],
         command: ['clone', '-nu', `sh -c "touch ./pwn"`, 'git@github.com:foo/bar.git'],
         config: {},
         configCommand: null,
         configEnv: {},
         pathspecs: [],
         prefix: [],
         separator: false,
         switches: [
            {
               argIndex: 1,
               combined: false,
               consumesNext: false,
               kind: 'command',
               name: '-nu',
               raw: '-nu',
            },
         ],
         task: 'clone',
      });
   });

   it('parses config-env switches', () => {
      const parsed = commandParser([
         '--config-env=core.sshCommand=GIT_SSH_COMMAND',
         'fetch',
         'origin',
      ]);

      expect(parsed.config).toEqual({});
      expect(parsed.configEnv).toEqual({
         'core.sshcommand': 'GIT_SSH_COMMAND',
      });
      expect(parsed.task).toBe('fetch');
      expect(parsed.prefix).toEqual(['--config-env=core.sshCommand=GIT_SSH_COMMAND']);
   });

   it('tracks combined short switches that consume following values', () => {
      const parsed = commandParser([
         'clone',
         '-uc',
         'git-upload-pack',
         'core.sshCommand=CMD',
         'git@github.com:foo/bar.git',
      ]);

      expect(parsed.switches).toEqual([
         {
            argIndex: 1,
            combined: true,
            consumesNext: true,
            kind: 'command',
            name: '-u',
            raw: '-u',
            value: 'git-upload-pack',
            valueIndex: 2,
         },
         {
            argIndex: 1,
            combined: true,
            consumesNext: true,
            kind: 'command',
            name: '-c',
            raw: '-c',
            value: 'core.sshCommand=CMD',
            valueIndex: 3,
         },
      ]);

      expect(parsed.config).toEqual({
         'core.sshcommand': 'CMD',
      });
   });

   it('does not treat consumed values as pathspec separators', () => {
      const parsed = commandParser(['commit', '-m', '--', pathspec('file-a')]);

      expect(parsed.args).toEqual(['-m', '--', '--', 'file-a']);
      expect(parsed.pathspecs).toEqual(['file-a']);
      expect(parsed.separator).toBe(false);
   });

   it('normalises wrapped pathspecs and explicit separators to the end', () => {
      const parsed = commandParser([
         'checkout',
         '--quiet',
         pathspec('file-a', 'file-b'),
         '--',
         'file-c',
         pathspec('file-d'),
      ]);

      expect(parsed.args).toEqual(['--quiet', '--', 'file-a', 'file-b', 'file-c', 'file-d']);
      expect(parsed.command).toEqual([
         'checkout',
         '--quiet',
         '--',
         'file-a',
         'file-b',
         'file-c',
         'file-d',
      ]);
      expect(parsed.pathspecs).toEqual(['file-a', 'file-b', 'file-c', 'file-d']);
      expect(parsed.separator).toBe(true);
   });

   it('detects read and write config commands', () => {
      expect(commandParser(['config', '--list']).configCommand).toEqual({
         action: 'list',
         writes: false,
      });

      expect(commandParser(['config', 'core.editor']).configCommand).toEqual({
         action: 'get',
         writes: false,
      });

      expect(commandParser(['config', 'core.editor', 'vim']).configCommand).toEqual({
         action: 'set',
         writes: true,
      });

      expect(commandParser(['config', '--unset', 'core.editor']).configCommand).toEqual({
         action: 'unset',
         writes: true,
      });

      expect(commandParser(['config', 'set', 'core.editor', 'vim']).configCommand).toEqual({
         action: 'set',
         writes: true,
      });
   });
});
