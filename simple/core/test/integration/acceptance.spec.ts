/**
 * Phase-2 acceptance criteria from the core-package plan (§3) - every call
 * style and plugin behaviour verified end-to-end against real `git` in a
 * temporary directory.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { promiseError } from '@kwsites/promise-result';

import { GitPluginError, type SimpleGitCore, simpleGitCore } from '../../index';
import { add } from '../../src/tasks/add';
import { commit } from '../../src/tasks/commit';
import { push } from '../../src/tasks/push';
import { showBuffer } from '../../src/tasks/show';
import type { SimpleGitCoreOptions } from '../../src/types';

const allowConfigWrite = ['init.defaultbranch', 'user.name', 'user.email'];

async function createTestRepo(options: Partial<SimpleGitCoreOptions> = {}) {
   const root = await mkdtemp(join(tmpdir(), 'simple-git-core-test-'));
   const git = simpleGitCore(root, { allowConfigWrite, ...options });

   await git.raw('-c', 'init.defaultbranch=main', 'init');
   await git.addConfig('user.name', 'Simple Git Tests');
   await git.addConfig('user.email', 'tests@simple-git.dev');

   return { root, git };
}

async function seedCommit(git: SimpleGitCore, root: string, name = 'file.txt') {
   await writeFile(join(root, name), `content of ${name}\n`);
   await git.add(name);
   return git.commit(`add ${name}`);
}

describe('phase 2 acceptance (real git)', () => {
   it('runs a series of tasks through run() resolving with the last result', async () => {
      const { root, git } = await createTestRepo();
      const bare = await mkdtemp(join(tmpdir(), 'simple-git-core-remote-'));
      await simpleGitCore(bare).raw('init', '--bare');
      await git.raw('remote', 'add', 'origin', bare);

      await writeFile(join(root, 'file.txt'), 'run acceptance\n');

      const pushed = await git.run(
         add('.'),
         commit('run acceptance'),
         push('origin', 'main', ['--set-upstream'])
      );

      expect(pushed.pushed[0]).toEqual(
         expect.objectContaining({ local: 'refs/heads/main', new: true })
      );

      const log = await simpleGitCore(bare).raw('log', '--oneline');
      expect(log).toContain('run acceptance');
   });

   it('supports every raw() call shape', async () => {
      const { git } = await createTestRepo();
      await seedCommit(git, (await git.raw('rev-parse', '--show-toplevel')).trim());

      expect(await git.raw('log', '--oneline')).toContain('add file.txt');
      expect(await git.raw(['log', '--oneline'])).toContain('add file.txt');
      expect(await git.raw(add('.'))).toBe('');
      expect(await git.raw('log', { '--oneline': null })).toContain('add file.txt');
   });

   it('streams buffer chunks through stream(showBuffer(...))', async () => {
      const { root, git } = await createTestRepo();
      await seedCommit(git, root, 'streamed.bin');

      const iterator = await git.stream(showBuffer('HEAD:streamed.bin'));

      const chunks: Buffer[] = [];
      for await (const chunk of iterator) {
         expect(Buffer.isBuffer(chunk)).toBe(true);
         chunks.push(chunk);
      }

      expect(Buffer.concat(chunks).toString('utf8')).toBe('content of streamed.bin\n');
   });

   it('stream() rejects when a guard blocks the spawn', async () => {
      const { git } = await createTestRepo();

      const error = await promiseError(
         git.stream({
            commands: ['-c', 'core.pager=cat', 'log'],
            format: 'buffer',
            parser: (buffer) => buffer,
         })
      );

      expect(error).toBeInstanceOf(GitPluginError);
      expect(String(error?.message)).toContain('core.pager');
   });

   it('supports sugar methods and method chaining', async () => {
      const { root, git } = await createTestRepo();
      await writeFile(join(root, 'chained.txt'), 'chained\n');

      const committed = await git.add('chained.txt').commit('chained commit');
      expect(committed.summary.changes).toBe(1);

      const status = await git.status();
      expect(status.isClean()).toBe(true);

      expect((await git.firstCommit()).length).toBeGreaterThan(0);
   });

   it('aborts an in-flight task via the abort signal', async () => {
      const { root } = await createTestRepo();
      const controller = new AbortController();

      const git = simpleGitCore(root, { abort: controller.signal, allowConfigWrite });
      const threw = promiseError(git.raw('log', '--oneline'));

      controller.abort();

      const error = await threw;
      expect(error).toBeInstanceOf(GitPluginError);
      expect(String(error?.message)).toMatch(/Abort (signal received|already signaled)/);
   });

   it('reports progress events during a clone', async () => {
      const { root: upstreamRoot, git: upstream } = await createTestRepo();
      for (let i = 0; i < 25; i++) {
         await writeFile(join(upstreamRoot, `file-${i}.txt`), `${'data'.repeat(500)}${i}\n`);
      }
      await upstream.add('.');
      await upstream.commit('seed upstream');

      const progress = vi.fn();
      const cloneRoot = await mkdtemp(join(tmpdir(), 'simple-git-core-clone-'));
      await simpleGitCore(cloneRoot, { progress }).clone(upstreamRoot, cloneRoot, ['--no-local']);

      expect(progress).toHaveBeenCalledWith(
         expect.objectContaining({
            method: 'clone',
            stage: expect.any(String),
            progress: expect.any(Number),
            processed: expect.any(Number),
            total: expect.any(Number),
         })
      );
   });

   it('kills a stalled process via the timeout plugin', async () => {
      const { root: upstreamRoot, git: upstream } = await createTestRepo();
      await seedCommit(upstream, upstreamRoot);

      const cloneRoot = await mkdtemp(join(tmpdir(), 'simple-git-core-timeout-'));
      const git = simpleGitCore(cloneRoot, { timeout: { block: 1 } });

      const error = await promiseError(git.raw('clone', upstreamRoot, '.'));
      expect(error).toBeInstanceOf(GitPluginError);
      expect(String(error?.message)).toContain('block timeout reached');
   });

   it('blocks unsafe custom binaries unless explicitly allowed', async () => {
      const { root } = await createTestRepo();

      expect(() => simpleGitCore(root, { binary: 'not a binary' })).toThrow(GitPluginError);
      expect(() =>
         simpleGitCore(root, {
            binary: 'git',
            unsafe: { allowUnsafeCustomBinary: true },
         })
      ).not.toThrow();
   });

   it('subjects construction-time config to allowConfigWrite like a runtime -c', async () => {
      const { root } = await createTestRepo();

      const blocked = simpleGitCore(root, { config: ['core.pager=cat'] });
      const error = await promiseError(blocked.raw('log', '--oneline'));
      expect(error).toBeInstanceOf(GitPluginError);
      expect(String(error?.message)).toContain('core.pager');

      const allowed = simpleGitCore(root, {
         config: ['blame.date=iso'],
         allowConfigWrite: ['blame.date'],
      });
      await expect(allowed.raw('log', '--oneline')).rejects.toThrow(
         // empty repo - command reached git and failed there, not in the guard
         /does not have any commits yet/
      );
   });
});
