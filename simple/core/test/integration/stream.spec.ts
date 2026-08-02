/**
 * `git.stream(task)` - the three places a streamed task can end up: chunks
 * then clean completion, a failure before the process spawned, and a failure
 * after it had already produced output.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { promiseError } from '@kwsites/promise-result';

import { GitPluginError, type SimpleGitCore, simpleGitCore } from '../../index';
import { GitError } from '../../src/errors';
import { show, showBuffer } from '../../src/tasks';

const allowConfigWrite = ['init.defaultbranch', 'user.name', 'user.email'];

async function createTestRepo() {
   const root = await mkdtemp(join(tmpdir(), 'simple-git-core-stream-'));
   const git = simpleGitCore(root, { allowConfigWrite });

   await git.raw('-c', 'init.defaultbranch=main', 'init');
   await git.addConfig('user.name', 'Simple Git Tests');
   await git.addConfig('user.email', 'tests@simple-git.dev');

   return { root, git };
}

async function commitFile(git: SimpleGitCore, root: string, name: string, content: string) {
   await writeFile(join(root, name), content);
   await git.add(name);
   await git.commit(`add ${name}`);
}

async function collect(iterator: AsyncIterableIterator<Buffer>) {
   const chunks: Buffer[] = [];
   for await (const chunk of iterator) {
      chunks.push(chunk);
   }
   return chunks;
}

describe('stream', () => {
   let root: string;
   let git: SimpleGitCore;

   beforeEach(async () => ({ root, git } = await createTestRepo()));

   it('yields every chunk of an output too large for one read', async () => {
      const content = `${'0123456789abcdef'.repeat(64 * 1024)}\n`; // 1MB
      await commitFile(git, root, 'large.txt', content);

      const chunks = await collect(await git.stream(showBuffer('HEAD:large.txt')));

      expect(chunks.length).toBeGreaterThan(1);
      expect(Buffer.concat(chunks).toString('utf8')).toBe(content);
   });

   it('completes with no chunks for a command that writes nothing', async () => {
      await commitFile(git, root, 'empty.txt', '');

      expect(await collect(await git.stream(showBuffer('HEAD:empty.txt')))).toEqual([]);
   });

   it('rejects before handing over an iterator when a guard blocks the spawn', async () => {
      const blocked = simpleGitCore(root, { config: ['core.pager=cat'] });
      const error = await promiseError(blocked.stream(show('HEAD')));

      expect(error).toBeInstanceOf(GitPluginError);
      expect(String(error?.message)).toContain('core.pager');
   });

   it('rejects rather than yielding when the process fails before writing any stdout', async () => {
      await commitFile(git, root, 'one.txt', 'one\n');

      // nothing reaches stdout, so completion settles the promise, not the iterator
      const error = await promiseError(git.stream(show('HEAD:no-such-file.txt')));

      expect(error).toBeInstanceOf(GitError);
      expect(String(error?.message)).toContain('no-such-file.txt');
   });

   it('keeps stderr out of the stream', async () => {
      await commitFile(git, root, 'one.txt', 'one\n');

      // `git checkout -b` reports itself on stderr and writes nothing to stdout
      const iterator = await git.stream({
         commands: ['checkout', '-b', 'other'],
         format: 'buffer',
         parser: (buffer) => buffer,
      });

      expect(await collect(iterator)).toEqual([]);
      expect(await git.raw('rev-parse', '--abbrev-ref', 'HEAD')).toContain('other');
   });
});
