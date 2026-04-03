import { describe, expect, it } from 'vitest';
import { parseCLI, pathspec } from '@simple-git/parse-cli';
import type { ConfigRead, ConfigWrite, ParsedCLI, ParsedCLISwitch } from '@simple-git/parse-cli';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sw(name: string, value?: string): ParsedCLISwitch {
   return value !== undefined ? { switch: name, value } : { switch: name };
}

function write(key: string, scope: ConfigWrite['scope'], value?: string): ConfigWrite {
   return value !== undefined ? { key, scope, value } : { key, scope };
}

function read(key: string, scope: ConfigRead['scope']): ConfigRead {
   return { key, scope };
}

// ── Task identification ───────────────────────────────────────────────────────

describe('task', () => {
   it('is null for an empty token list', () => {
      expect(parseCLI([]).task).toBeNull();
   });

   it('is null when only global flags are present', () => {
      expect(parseCLI(['--version']).task).toBeNull();
      expect(parseCLI(['-v']).task).toBeNull();
   });

   it('identifies a simple sub-command', () => {
      expect(parseCLI(['commit', '-m', 'foo']).task).toBe('commit');
   });

   it('is lowercased', () => {
      expect(parseCLI(['COMMIT']).task).toBe('commit');
   });

   it('is identified after any number of global switches', () => {
      expect(parseCLI(['-c', 'key=val', 'push']).task).toBe('push');
      expect(parseCLI(['--no-pager', 'log', '--oneline']).task).toBe('log');
      expect(parseCLI(['-v', 'status']).task).toBe('status');
   });

   it('is preserved for unknown sub-commands', () => {
      expect(parseCLI(['rebase', '-i', 'HEAD~3']).task).toBe('rebase');
      expect(parseCLI(['bisect', 'start']).task).toBe('bisect');
   });
});

// ── Short switches ────────────────────────────────────────────────────────────

describe('short switches', () => {
   it('parses a bare flag', () => {
      expect(parseCLI(['add', '-A']).switches).toEqual([sw('-A')]);
   });

   it('parses a switch that consumes the next token', () => {
      expect(parseCLI(['commit', '-m', 'the message']).switches).toEqual([sw('-m', 'the message')]);
   });

   it('expands a known cluster into individual entries', () => {
      // clone -u and -c are both value-consumers
      const { switches } = parseCLI(['clone', '-uc', 'git-upload-pack', 'core.sshCommand=CMD', 'git@github.com:x/y.git']);
      expect(switches).toContainEqual(sw('-u', 'git-upload-pack'));
      expect(switches).toContainEqual(sw('-c', 'core.sshCommand=CMD'));
   });

   it('keeps an unknown cluster as one opaque switch', () => {
      // -n is not in clone's known short switches
      const { switches } = parseCLI(['clone', '-nu', 'git@github.com:x/y.git']);
      expect(switches).toEqual([sw('-nu')]);
   });

   it('embeds the remainder as a value when a consumer precedes unknown chars', () => {
      // commit -mFix: -m is a consumer, 'Fix' is not a cluster of known flags
      expect(parseCLI(['commit', '-mFix']).switches).toContainEqual(sw('-m', 'Fix'));
   });

   it('does not collapse separate short switches', () => {
      const { switches } = parseCLI(['commit', '-m', 'msg', '-C', 'HEAD']);
      expect(switches).toContainEqual(sw('-m', 'msg'));
      expect(switches).toContainEqual(sw('-C', 'HEAD'));
   });
});

// ── Long options ──────────────────────────────────────────────────────────────

describe('long options', () => {
   it('parses a bare flag', () => {
      expect(parseCLI(['commit', '--amend']).switches).toEqual([sw('--amend')]);
   });

   it('parses a negated flag', () => {
      expect(parseCLI(['push', '--no-verify']).switches).toEqual([sw('--no-verify')]);
      expect(parseCLI(['status', '--no-short']).switches).toEqual([sw('--no-short')]);
   });

   it('parses a value embedded with =', () => {
      expect(parseCLI(['push', '--exec=custom-pack']).switches).toContainEqual(sw('--exec', 'custom-pack'));
   });

   it('parses a value from the next token', () => {
      expect(parseCLI(['commit', '--message', 'the fix']).switches).toContainEqual(sw('--message', 'the fix'));
   });

   it('handles = in the value', () => {
      expect(parseCLI(['push', '--receive-pack=ssh -i key']).switches)
         .toContainEqual(sw('--receive-pack', 'ssh -i key'));
   });
});

// ── Global switches (before the sub-command) ─────────────────────────────────

describe('global switches', () => {
   it('are included in the switches list', () => {
      const { switches } = parseCLI(['-v', 'status']);
      expect(switches).toContainEqual(sw('-v'));
   });

   it('-c is included alongside command switches', () => {
      const { switches } = parseCLI(['-c', 'core.fsmonitor=false', 'status']);
      expect(switches).toContainEqual(sw('-c', 'core.fsmonitor=false'));
   });

   it('--config-env is included with its value', () => {
      const { switches } = parseCLI(['--config-env=core.sshCommand=GIT_SSH_COMMAND', 'fetch']);
      expect(switches).toContainEqual(sw('--config-env', 'core.sshCommand=GIT_SSH_COMMAND'));
   });

   it('mixes with command switches', () => {
      const { switches } = parseCLI(['-v', 'commit', '--amend']);
      expect(switches).toContainEqual(sw('-v'));
      expect(switches).toContainEqual(sw('--amend'));
   });
});

// ── Path handling ─────────────────────────────────────────────────────────────

describe('paths', () => {
   it('is empty when there are no path tokens', () => {
      expect(parseCLI(['commit', '-m', 'msg']).paths).toEqual([]);
   });

   it('collects tokens after a -- separator', () => {
      expect(parseCLI(['add', '--', 'a.ts', 'b.ts']).paths).toEqual(['a.ts', 'b.ts']);
   });

   it('does not include the -- separator itself', () => {
      expect(parseCLI(['checkout', '--quiet', '--', 'src/index.ts']).paths).toEqual(['src/index.ts']);
   });

   it('does not treat a -- consumed as a switch value as a separator', () => {
      // -m absorbs '--' as its message
      const { switches, paths } = parseCLI(['commit', '-m', '--', pathspec('file-a')]);
      expect(switches).toContainEqual(sw('-m', '--'));
      expect(paths).toEqual(['file-a']);
   });

   it('unwraps pathspec() objects before the separator', () => {
      expect(parseCLI(['checkout', pathspec('a.ts', 'b.ts')]).paths).toEqual(['a.ts', 'b.ts']);
   });

   it('collects paths from both pathspec() objects and an explicit separator', () => {
      const { paths } = parseCLI([
         'checkout', '--quiet',
         pathspec('a.ts', 'b.ts'),
         '--',
         'c.ts',
         pathspec('d.ts'),
      ]);
      expect(paths).toEqual(['a.ts', 'b.ts', 'c.ts', 'd.ts']);
   });

   it('routes tokens after -- to paths even when they look like flags', () => {
      const { switches, paths } = parseCLI(['checkout', '--', '-not-a-switch', 'file.ts']);
      expect(switches).toEqual([]);
      expect(paths).toEqual(['-not-a-switch', 'file.ts']);
   });
});

// ── Config writes – inline overrides ─────────────────────────────────────────

describe('inline config overrides', () => {
   it('-c key=value → scope "inline"', () => {
      expect(parseCLI(['-c', 'core.sshCommand=CMD', 'fetch']).configWrites).toEqual([
         write('core.sshcommand', 'inline', 'CMD'),
      ]);
   });

   it('lower-cases the key', () => {
      expect(parseCLI(['-c', 'Http.proxy=http://proxy:3128', 'push']).configWrites[0].key)
         .toBe('http.proxy');
   });

   it('accumulates multiple -c flags', () => {
      const { configWrites } = parseCLI([
         '-c', 'core.sshCommand=CMD1',
         '-c', 'core.fsmonitor=false',
         'commit', '-m', 'msg',
      ]);
      expect(configWrites).toEqual([
         write('core.sshcommand', 'inline', 'CMD1'),
         write('core.fsmonitor', 'inline', 'false'),
      ]);
   });

   it('command-level --config also produces scope "inline"', () => {
      const { configWrites } = parseCLI(['clone', '--config', 'core.sshCommand=CMD', 'git@github.com:x/y.git']);
      expect(configWrites).toContainEqual(write('core.sshcommand', 'inline', 'CMD'));
   });

   it('--config-env → scope "env", value is the env-var name', () => {
      const { configWrites } = parseCLI(['--config-env=core.sshCommand=GIT_SSH_COMMAND', 'fetch']);
      expect(configWrites).toEqual([write('core.sshcommand', 'env', 'GIT_SSH_COMMAND')]);
   });

   it('-uc cluster correctly identifies the -c value as an inline write', () => {
      const { configWrites } = parseCLI([
         'clone', '-uc', 'git-upload-pack', 'core.sshCommand=CMD', 'git@github.com:x/y.git',
      ]);
      expect(configWrites).toContainEqual(write('core.sshcommand', 'inline', 'CMD'));
   });

   it('produces no writes for a plain command', () => {
      expect(parseCLI(['push', '--force']).configWrites).toEqual([]);
   });
});

// ── Config writes – git config sub-command ────────────────────────────────────

describe('git config writes', () => {
   it('two positionals → local set', () => {
      expect(parseCLI(['config', 'user.name', 'Steve']).configWrites)
         .toContainEqual(write('user.name', 'local', 'Steve'));
   });

   it('--global scope', () => {
      expect(parseCLI(['config', '--global', 'user.email', 'dev@example.com']).configWrites)
         .toContainEqual(write('user.email', 'global', 'dev@example.com'));
   });

   it('--system scope', () => {
      expect(parseCLI(['config', '--system', 'core.editor', 'vim']).configWrites)
         .toContainEqual(write('core.editor', 'system', 'vim'));
   });

   it('--worktree scope', () => {
      expect(parseCLI(['config', '--worktree', 'core.sparseCheckout', 'true']).configWrites)
         .toContainEqual(write('core.sparsecheckout', 'worktree', 'true'));
   });

   it('--file scope', () => {
      expect(parseCLI(['config', '--file', '/tmp/c.cfg', 'core.editor', 'vim']).configWrites)
         .toContainEqual(write('core.editor', 'file', 'vim'));
   });

   it('--unset → write without value', () => {
      expect(parseCLI(['config', '--unset', 'user.name']).configWrites)
         .toContainEqual(write('user.name', 'local'));
   });

   it('--unset-all → write without value', () => {
      expect(parseCLI(['config', '--unset-all', 'core.editor']).configWrites)
         .toContainEqual(write('core.editor', 'local'));
   });

   it('--remove-section → key is the section name, no value', () => {
      expect(parseCLI(['config', '--remove-section', 'user']).configWrites)
         .toContainEqual(write('user', 'local'));
   });

   it('--rename-section → key = old name, value = new name', () => {
      expect(parseCLI(['config', '--rename-section', 'user', 'author']).configWrites)
         .toContainEqual(write('user', 'local', 'author'));
   });

   it('--add → key + value', () => {
      expect(parseCLI(['config', '--add', 'remote.origin.fetch', 'refs/*']).configWrites)
         .toContainEqual(write('remote.origin.fetch', 'local', 'refs/*'));
   });

   it('sub-command syntax: config set key value', () => {
      expect(parseCLI(['config', 'set', 'core.editor', 'vim']).configWrites)
         .toContainEqual(write('core.editor', 'local', 'vim'));
   });

   it('sub-command syntax with scope: config --global set key value', () => {
      expect(parseCLI(['config', '--global', 'set', 'user.name', 'Steve']).configWrites)
         .toContainEqual(write('user.name', 'global', 'Steve'));
   });

   it('lower-cases the key', () => {
      expect(parseCLI(['config', 'Core.Editor', 'vim']).configWrites[0].key).toBe('core.editor');
   });

   it('--list produces no writes', () => {
      expect(parseCLI(['config', '--list']).configWrites).toEqual([]);
   });

   it('--edit produces no writes (unknowable at parse time)', () => {
      expect(parseCLI(['config', '--edit']).configWrites).toEqual([]);
   });
});

// ── Config reads – git config sub-command ─────────────────────────────────────

describe('git config reads', () => {
   it('single positional → local get', () => {
      expect(parseCLI(['config', 'user.name']).configReads).toEqual([read('user.name', 'local')]);
   });

   it('--global scope', () => {
      expect(parseCLI(['config', '--global', 'user.email']).configReads)
         .toEqual([read('user.email', 'global')]);
   });

   it('--get flag', () => {
      expect(parseCLI(['config', '--get', 'core.editor']).configReads)
         .toContainEqual(read('core.editor', 'local'));
   });

   it('--get-all flag', () => {
      expect(parseCLI(['config', '--get-all', 'remote.origin.fetch']).configReads)
         .toContainEqual(read('remote.origin.fetch', 'local'));
   });

   it('--get-regexp flag', () => {
      expect(parseCLI(['config', '--get-regexp', 'remote']).configReads)
         .toContainEqual(read('remote', 'local'));
   });

   it('sub-command syntax: config get key', () => {
      expect(parseCLI(['config', 'get', 'user.name']).configReads)
         .toContainEqual(read('user.name', 'local'));
   });

   it('sub-command syntax with scope: config --global get key', () => {
      expect(parseCLI(['config', '--global', 'get', 'user.email']).configReads)
         .toContainEqual(read('user.email', 'global'));
   });

   it('lower-cases the key', () => {
      expect(parseCLI(['config', 'User.Name']).configReads[0].key).toBe('user.name');
   });

   it('two positionals → write, not read', () => {
      expect(parseCLI(['config', 'user.name', 'Steve']).configReads).toEqual([]);
   });

   it('--list → no reads (no specific key)', () => {
      expect(parseCLI(['config', '--list']).configReads).toEqual([]);
   });
});

// ── Complete output shapes ────────────────────────────────────────────────────

describe('full ParsedCLI shape', () => {
   it('simple commit', () => {
      expect(parseCLI(['commit', '-m', 'initial'])).toEqual<ParsedCLI>({
         task: 'commit',
         switches: [sw('-m', 'initial')],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('push with force', () => {
      expect(parseCLI(['push', 'origin', 'main', '--force'])).toEqual<ParsedCLI>({
         task: 'push',
         switches: [sw('--force')],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('bare status', () => {
      expect(parseCLI(['status'])).toEqual<ParsedCLI>({
         task: 'status',
         switches: [],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('empty token list', () => {
      expect(parseCLI([])).toEqual<ParsedCLI>({
         task: null,
         switches: [],
         paths: [],
         configWrites: [],
         configReads: [],
      });
   });

   it('inline write + config command write are independent entries', () => {
      const result = parseCLI([
         '-c', 'http.proxy=http://proxy:3128',
         'config', '--global', 'user.name', 'Steve',
      ]);
      expect(result.configWrites).toContainEqual(write('http.proxy',  'inline', 'http://proxy:3128'));
      expect(result.configWrites).toContainEqual(write('user.name', 'global', 'Steve'));
      expect(result.configReads).toEqual([]);
   });
});

// ── Security-relevant edge cases ──────────────────────────────────────────────

describe('security edge cases', () => {
   it('detects core.sshCommand injection via -c on any sub-command', () => {
      const { configWrites } = parseCLI([
         '-c', 'core.sshCommand=ssh -o ProxyCommand="id > /tmp/pwn"',
         'fetch', 'origin',
      ]);
      expect(configWrites).toHaveLength(1);
      expect(configWrites[0]).toMatchObject({ key: 'core.sshcommand', scope: 'inline' });
   });

   it('detects core.fsmonitor injection', () => {
      const { configWrites } = parseCLI(['-c', 'core.fsmonitor=touch /tmp/pwn', 'status']);
      expect(configWrites[0].key).toBe('core.fsmonitor');
   });

   it('detects uploadpack.packObjectsHook injection', () => {
      const { configWrites } = parseCLI([
         '-c', 'uploadpack.packObjectsHook=sh -c "id > /tmp/pwn"',
         'clone', 'git@github.com:x/y.git',
      ]);
      expect(configWrites[0].key).toBe('uploadpack.packobjectshook');
   });

   it('collects all -c keys from a multi-override invocation', () => {
      const { configWrites } = parseCLI([
         '-c', 'protocol.allow=never',
         '-c', 'protocol.ext.allow=always',
         '-c', 'core.gitProxy=sh -c "id > /tmp/pwn"',
         'ls-remote', 'ext::sh -c "id > /tmp/pwn"',
      ]);
      const keys = configWrites.map((w) => w.key);
      expect(keys).toContain('protocol.allow');
      expect(keys).toContain('protocol.ext.allow');
      expect(keys).toContain('core.gitproxy');
   });

   it('--config-env is flagged as an env-scope write', () => {
      const { configWrites } = parseCLI(['--config-env=core.sshCommand=MY_SSH_CMD', 'fetch']);
      expect(configWrites).toEqual([write('core.sshcommand', 'env', 'MY_SSH_CMD')]);
   });

   it('an opaque unknown cluster does not produce false config writes', () => {
      const { configWrites, paths } = parseCLI([
         'clone', '-nu', 'git@github.com:x/y.git',
      ]);
      expect(configWrites).toEqual([]);
      expect(paths).toEqual([]);
   });

   it('tokens after -- are not mistaken for switches', () => {
      const { switches, paths } = parseCLI(['checkout', '--', '-not-a-switch']);
      expect(switches).toEqual([]);
      expect(paths).toContain('-not-a-switch');
   });
});