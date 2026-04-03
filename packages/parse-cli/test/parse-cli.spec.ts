import { describe, expect, it } from 'vitest';
import { parseCLI } from '@simple-git/parse-cli';
import type { ConfigRead, ConfigWrite, ParsedCLI, ParsedCLISwitch } from '@simple-git/parse-cli';
import { pathspec } from '@simple-git/command-parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sw(name: string, value?: string): ParsedCLISwitch {
   return value !== undefined ? { switch: name, value } : { switch: name };
}

function write(key: string, scope: ConfigWrite['scope'], value?: string): ConfigWrite {
   return value !== undefined ? { key, scope, value } : { key, scope };
}

function read(key: string, scope: ConfigRead['scope']): ConfigRead {
   return { key, scope };
}

// ---------------------------------------------------------------------------
// Task identification
// ---------------------------------------------------------------------------

describe('task', () => {
   it('identifies a simple sub-command', () => {
      expect(parseCLI(['commit', '-m', 'foo']).task).toBe('commit');
   });

   it('is case-insensitive', () => {
      expect(parseCLI(['COMMIT', '-m', 'foo']).task).toBe('commit');
   });

   it('identifies task when global options precede it', () => {
      expect(parseCLI(['-c', 'key=val', 'push']).task).toBe('push');
      expect(parseCLI(['--no-pager', 'log', '--oneline']).task).toBe('log');
   });

   it('is null when there is no positional sub-command', () => {
      expect(parseCLI(['--version']).task).toBeNull();
      expect(parseCLI(['-v']).task).toBeNull();
      expect(parseCLI([]).task).toBeNull();
   });

   it('recognises tasks not in the known-options table', () => {
      expect(parseCLI(['rebase', '-i', 'HEAD~3']).task).toBe('rebase');
      expect(parseCLI(['stash', 'pop']).task).toBe('stash');
      expect(parseCLI(['bisect', 'start']).task).toBe('bisect');
   });
});

// ---------------------------------------------------------------------------
// Switch / option parsing
// ---------------------------------------------------------------------------

describe('switches', () => {
   describe('short switches', () => {
      it('parses a bare short switch', () => {
         expect(parseCLI(['add', '-A']).switches).toEqual([sw('-A')]);
      });

      it('parses a short switch that consumes the next token as its value', () => {
         expect(parseCLI(['commit', '-m', 'the message']).switches).toEqual([
            sw('-m', 'the message'),
         ]);
      });

      it('parses multiple independent short switches', () => {
         const { switches } = parseCLI(['commit', '-m', 'msg', '-C', 'HEAD']);
         expect(switches).toContainEqual(sw('-m', 'msg'));
         expect(switches).toContainEqual(sw('-C', 'HEAD'));
      });

      it('expands a combined short-switch cluster into individual entries', () => {
         // -uc for `git clone`: -u consumes the next token, -c consumes the one after
         const { switches } = parseCLI([
            'clone',
            '-uc',
            'git-upload-pack',
            'core.sshCommand=CMD',
            'git@github.com:example/repo.git',
         ]);
         expect(switches).toContainEqual(sw('-u', 'git-upload-pack'));
         expect(switches).toContainEqual(sw('-c', 'core.sshCommand=CMD'));
      });

      it('treats an unknown cluster as a single opaque switch', () => {
         const { switches } = parseCLI(['clone', '-nu', 'git@github.com:example/repo.git']);
         expect(switches).toEqual([sw('-nu')]);
      });
   });

   describe('long options', () => {
      it('parses a long option that is a bare flag', () => {
         expect(parseCLI(['commit', '--amend']).switches).toEqual([sw('--amend')]);
      });

      it('parses a negated long option', () => {
         expect(parseCLI(['push', '--no-verify']).switches).toEqual([sw('--no-verify')]);
         expect(parseCLI(['status', '--no-short']).switches).toEqual([sw('--no-short')]);
      });

      it('parses a long option with value via `=`', () => {
         expect(parseCLI(['push', '--exec=some-pack-program']).switches).toEqual([
            sw('--exec', 'some-pack-program'),
         ]);
      });

      it('parses a long option that consumes the next token', () => {
         expect(parseCLI(['commit', '--message', 'my commit']).switches).toEqual([
            sw('--message', 'my commit'),
         ]);
      });

      it('parses a long option with embedded `=` in the value', () => {
         expect(parseCLI(['push', '--receive-pack=ssh -i ~/.ssh/id_ed25519']).switches).toEqual([
            sw('--receive-pack', 'ssh -i ~/.ssh/id_ed25519'),
         ]);
      });
   });

   describe('global options (before sub-command)', () => {
      it('includes global short switches in the switches array', () => {
         const { switches } = parseCLI(['-v', 'status']);
         expect(switches).toContainEqual(sw('-v'));
      });

      it('includes a global -c override in the switches array', () => {
         const { switches } = parseCLI(['-c', 'core.fsmonitor=false', 'status']);
         expect(switches).toContainEqual(sw('-c', 'core.fsmonitor=false'));
      });

      it('includes a global long option in the switches array', () => {
         const { switches } = parseCLI(['--no-pager', 'log']);
         expect(switches).toContainEqual(sw('--no-pager'));
      });

      it('includes --config-env in the switches array', () => {
         const { switches } = parseCLI([
            '--config-env=core.sshCommand=GIT_SSH_COMMAND',
            'fetch',
            'origin',
         ]);
         expect(switches).toContainEqual(
            sw('--config-env', 'core.sshCommand=GIT_SSH_COMMAND')
         );
      });

      it('collects both global and command switches', () => {
         const { switches } = parseCLI(['-v', 'commit', '--amend']);
         expect(switches).toContainEqual(sw('-v'));
         expect(switches).toContainEqual(sw('--amend'));
      });
   });
});

// ---------------------------------------------------------------------------
// Path handling
// ---------------------------------------------------------------------------

describe('paths', () => {
   it('is empty when no paths are present', () => {
      expect(parseCLI(['commit', '-m', 'msg']).paths).toEqual([]);
   });

   it('collects tokens after a `--` separator', () => {
      expect(parseCLI(['add', '--', 'file.txt', 'other.txt']).paths).toEqual([
         'file.txt',
         'other.txt',
      ]);
   });

   it('does not include the `--` separator itself', () => {
      const { paths } = parseCLI(['checkout', '--quiet', '--', 'src/index.ts']);
      expect(paths).toEqual(['src/index.ts']);
   });

   it('does not treat a `--` consumed as a switch value as a separator', () => {
      // `-m` consumes `--` as its message value
      const { paths, switches } = parseCLI(['commit', '-m', '--', pathspec('file-a')]);
      expect(switches).toContainEqual(sw('-m', '--'));
      expect(paths).toEqual(['file-a']);
   });

   it('unwraps pathspec() objects', () => {
      const { paths } = parseCLI(['checkout', pathspec('file-a', 'file-b')]);
      expect(paths).toEqual(['file-a', 'file-b']);
   });

   it('collects paths from both a pathspec object and an explicit separator', () => {
      const { paths } = parseCLI([
         'checkout',
         '--quiet',
         pathspec('file-a', 'file-b'),
         '--',
         'file-c',
         pathspec('file-d'),
      ]);
      expect(paths).toEqual(['file-a', 'file-b', 'file-c', 'file-d']);
   });
});

// ---------------------------------------------------------------------------
// Config writes – inline runtime overrides
// ---------------------------------------------------------------------------

describe('configWrites – inline overrides', () => {
   it('records a -c override with scope "inline"', () => {
      expect(parseCLI(['-c', 'core.sshCommand=CMD', 'fetch']).configWrites).toEqual([
         write('core.sshcommand', 'inline', 'CMD'),
      ]);
   });

   it('lower-cases the config key', () => {
      const { configWrites } = parseCLI(['-c', 'Http.proxy=http://proxy:3128', 'push']);
      expect(configWrites[0].key).toBe('http.proxy');
   });

   it('records multiple -c overrides', () => {
      const { configWrites } = parseCLI([
         '-c',
         'core.sshCommand=CMD1',
         '-c',
         'core.fsmonitor=false',
         'commit',
         '-m',
         'msg',
      ]);
      expect(configWrites).toEqual([
         write('core.sshcommand', 'inline', 'CMD1'),
         write('core.fsmonitor', 'inline', 'false'),
      ]);
   });

   it('records a command-level --config override with scope "inline"', () => {
      const { configWrites } = parseCLI([
         'clone',
         '--config',
         'core.sshCommand=CMD',
         'git@github.com:example/repo.git',
      ]);
      expect(configWrites).toContainEqual(write('core.sshcommand', 'inline', 'CMD'));
   });

   it('records a --config-env override with scope "env" and the env-var name as value', () => {
      const { configWrites } = parseCLI([
         '--config-env=core.sshCommand=GIT_SSH_COMMAND',
         'fetch',
         'origin',
      ]);
      expect(configWrites).toEqual([
         write('core.sshcommand', 'env', 'GIT_SSH_COMMAND'),
      ]);
   });

   it('does not add config writes for a plain command with no -c', () => {
      expect(parseCLI(['push', '--force']).configWrites).toEqual([]);
   });

   it('handles a -uc combined cluster that embeds a -c value', () => {
      const { configWrites } = parseCLI([
         'clone',
         '-uc',
         'git-upload-pack',
         'core.sshCommand=CMD',
         'git@github.com:example/repo.git',
      ]);
      expect(configWrites).toContainEqual(write('core.sshcommand', 'inline', 'CMD'));
   });
});

// ---------------------------------------------------------------------------
// Config writes – `git config` sub-command
// ---------------------------------------------------------------------------

describe('configWrites – git config command', () => {
   it('records a local set (two positionals, default scope)', () => {
      expect(parseCLI(['config', 'user.name', 'Steve']).configWrites).toContainEqual(
         write('user.name', 'local', 'Steve')
      );
   });

   it('records a global set', () => {
      expect(parseCLI(['config', '--global', 'user.email', 'steve@example.com']).configWrites)
         .toContainEqual(write('user.email', 'global', 'steve@example.com'));
   });

   it('records a system set', () => {
      expect(parseCLI(['config', '--system', 'core.editor', 'vim']).configWrites)
         .toContainEqual(write('core.editor', 'system', 'vim'));
   });

   it('records a worktree set', () => {
      expect(parseCLI(['config', '--worktree', 'core.sparseCheckout', 'true']).configWrites)
         .toContainEqual(write('core.sparsecheckout', 'worktree', 'true'));
   });

   it('records a file-scoped set', () => {
      expect(
         parseCLI(['config', '--file', '/tmp/custom.cfg', 'core.editor', 'vim']).configWrites
      ).toContainEqual(write('core.editor', 'file', 'vim'));
   });

   it('records an --unset (write without value)', () => {
      expect(parseCLI(['config', '--unset', 'user.name']).configWrites).toContainEqual(
         write('user.name', 'local')
      );
   });

   it('records an --unset-all (write without value)', () => {
      expect(parseCLI(['config', '--unset-all', 'core.editor']).configWrites).toContainEqual(
         write('core.editor', 'local')
      );
   });

   it('records a --remove-section (write without value, key is section name)', () => {
      expect(parseCLI(['config', '--remove-section', 'user']).configWrites).toContainEqual(
         write('user', 'local')
      );
   });

   it('records a --rename-section (key = old name, value = new name)', () => {
      expect(
         parseCLI(['config', '--rename-section', 'user', 'author']).configWrites
      ).toContainEqual(write('user', 'local', 'author'));
   });

   it('records a set using the new sub-command syntax: config set key value', () => {
      expect(parseCLI(['config', 'set', 'core.editor', 'vim']).configWrites).toContainEqual(
         write('core.editor', 'local', 'vim')
      );
   });

   it('records a global set using sub-command syntax', () => {
      expect(
         parseCLI(['config', '--global', 'set', 'user.name', 'Steve']).configWrites
      ).toContainEqual(write('user.name', 'global', 'Steve'));
   });

   it('records an --add (key=existing-key, value=new-value)', () => {
      expect(parseCLI(['config', '--add', 'remote.origin.fetch', 'refs/*']).configWrites)
         .toContainEqual(write('remote.origin.fetch', 'local', 'refs/*'));
   });

   it('lower-cases the config key', () => {
      const [entry] = parseCLI(['config', 'Core.Editor', 'vim']).configWrites;
      expect(entry.key).toBe('core.editor');
   });

   it('does not add writes for --list', () => {
      const { configWrites, configReads } = parseCLI(['config', '--list']);
      expect(configWrites).toEqual([]);
      expect(configReads).toEqual([]);
   });

   it('does not add entries for --edit (unknowable at parse time)', () => {
      const { configWrites, configReads } = parseCLI(['config', '--edit']);
      expect(configWrites).toEqual([]);
      expect(configReads).toEqual([]);
   });
});

// ---------------------------------------------------------------------------
// Config reads – `git config` sub-command
// ---------------------------------------------------------------------------

describe('configReads – git config command', () => {
   it('records a local get (single positional, default scope)', () => {
      expect(parseCLI(['config', 'user.name']).configReads).toEqual([
         read('user.name', 'local'),
      ]);
   });

   it('records a global get', () => {
      expect(parseCLI(['config', '--global', 'user.email']).configReads).toEqual([
         read('user.email', 'global'),
      ]);
   });

   it('records a --get', () => {
      expect(parseCLI(['config', '--get', 'core.editor']).configReads).toEqual([
         read('core.editor', 'local'),
      ]);
   });

   it('records a --get-all', () => {
      expect(parseCLI(['config', '--get-all', 'remote.origin.fetch']).configReads).toEqual([
         read('remote.origin.fetch', 'local'),
      ]);
   });

   it('records a --get-regexp', () => {
      expect(parseCLI(['config', '--get-regexp', 'remote']).configReads).toContainEqual(
         read('remote', 'local')
      );
   });

   it('records a get using sub-command syntax: config get key', () => {
      expect(parseCLI(['config', 'get', 'user.name']).configReads).toContainEqual(
         read('user.name', 'local')
      );
   });

   it('records a global get using sub-command syntax', () => {
      expect(
         parseCLI(['config', '--global', 'get', 'user.email']).configReads
      ).toContainEqual(read('user.email', 'global'));
   });

   it('lower-cases the config key', () => {
      const [entry] = parseCLI(['config', 'User.Name']).configReads;
      expect(entry.key).toBe('user.name');
   });

   it('does not add reads for a two-positional write', () => {
      expect(parseCLI(['config', 'user.name', 'Steve']).configReads).toEqual([]);
   });

   it('does not add reads for a --list', () => {
      expect(parseCLI(['config', '--list']).configReads).toEqual([]);
   });
});

// ---------------------------------------------------------------------------
// Full ParsedCLI shape – snapshot-style tests for complete output
// ---------------------------------------------------------------------------

describe('full ParsedCLI shape', () => {
   it('produces a complete object for a simple commit', () => {
      const result = parseCLI(['commit', '-m', 'initial commit']);
      expect(result).toEqual<ParsedCLI>({
         task: 'commit',
         switches: [sw('-m', 'initial commit')],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('produces a complete object for a push with force', () => {
      expect(parseCLI(['push', 'origin', 'main', '--force'])).toEqual<ParsedCLI>({
         task: 'push',
         switches: [sw('--force')],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('produces a complete object for a clone with -c override', () => {
      const result = parseCLI([
         '-c',
         'core.sshCommand=ssh -i ~/.ssh/deploy_key',
         'clone',
         'git@github.com:example/repo.git',
      ]);
      expect(result.task).toBe('clone');
      expect(result.configWrites).toEqual([
         write('core.sshcommand', 'inline', 'ssh -i ~/.ssh/deploy_key'),
      ]);
      expect(result.configReads).toEqual([]);
   });

   it('combines inline writes and config-command writes independently', () => {
      const result = parseCLI([
         '-c',
         'http.proxy=http://proxy:3128',
         'config',
         '--global',
         'user.name',
         'Steve',
      ]);
      expect(result.configWrites).toContainEqual(
         write('http.proxy', 'inline', 'http://proxy:3128')
      );
      expect(result.configWrites).toContainEqual(write('user.name', 'global', 'Steve'));
      expect(result.configReads).toEqual([]);
   });

   it('reports empty collections for a bare status call', () => {
      expect(parseCLI(['status'])).toEqual<ParsedCLI>({
         task: 'status',
         switches: [],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('handles an empty token array', () => {
      expect(parseCLI([])).toEqual<ParsedCLI>({
         task: null,
         switches: [],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });
});

// ---------------------------------------------------------------------------
// Edge cases and security-relevant scenarios
// ---------------------------------------------------------------------------

describe('security-relevant edge cases', () => {
   it('detects core.sshCommand injection via -c on any sub-command', () => {
      const { configWrites } = parseCLI([
         '-c',
         'core.sshCommand=ssh -o ProxyCommand="touch /tmp/pwn"',
         'fetch',
         'origin',
      ]);
      expect(configWrites).toHaveLength(1);
      expect(configWrites[0].key).toBe('core.sshcommand');
      expect(configWrites[0].scope).toBe('inline');
   });

   it('detects core.fsmonitor injection via -c', () => {
      const { configWrites } = parseCLI([
         '-c',
         'core.fsmonitor=touch /tmp/pwn',
         'status',
      ]);
      expect(configWrites[0].key).toBe('core.fsmonitor');
   });

   it('detects uploadpack.packObjectsHook injection', () => {
      const { configWrites } = parseCLI([
         '-c',
         'uploadpack.packObjectsHook=sh -c "id > /tmp/pwn"',
         'clone',
         'git@github.com:example/repo.git',
      ]);
      expect(configWrites[0].key).toBe('uploadpack.packobjectshook');
   });

   it('handles multiple -c options on the same invocation', () => {
      const { configWrites } = parseCLI([
         '-c',
         'protocol.allow=never',
         '-c',
         'protocol.ext.allow=always',
         '-c',
         'core.gitProxy=sh -c "touch /tmp/pwn"',
         'ls-remote',
         'ext::sh -c "touch /tmp/pwn"',
      ]);
      const keys = configWrites.map((w) => w.key);
      expect(keys).toContain('protocol.allow');
      expect(keys).toContain('protocol.ext.allow');
      expect(keys).toContain('core.gitproxy');
   });

   it('detects config-env override for sshCommand', () => {
      const { configWrites } = parseCLI([
         '--config-env=core.sshCommand=MY_SSH_CMD',
         'fetch',
      ]);
      expect(configWrites).toEqual([write('core.sshcommand', 'env', 'MY_SSH_CMD')]);
   });

   it('does not produce false positives for a safe add command', () => {
      const result = parseCLI(['add', 'src/index.ts']);
      expect(result.configWrites).toEqual([]);
      expect(result.configReads).toEqual([]);
      expect(result.task).toBe('add');
   });

   it('does not promote paths after -- into switches', () => {
      const { switches, paths } = parseCLI([
         'checkout',
         '--',
         '-not-a-switch',
         'real-file.ts',
      ]);
      expect(switches).toEqual([]);
      expect(paths).toEqual(['-not-a-switch', 'real-file.ts']);
   });
});