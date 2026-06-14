import { add, catFileBuffer, commit, GitPluginError, lsFiles, version } from '@simple-git/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTempRepo, type TempRepo } from './__fixtures__/repo';

describe('core executor (integration)', () => {
   let repo: TempRepo;

   beforeEach(() => {
      repo = createTempRepo();
   });

   afterEach(() => {
      repo.cleanup();
   });

   it('runs version against the real binary', async () => {
      const result = await repo.git.run(version());
      expect(result.installed).toBe(true);
      expect(result.major).toBeGreaterThanOrEqual(2);
   });

   it('stages and commits, returning a real CommitResult', async () => {
      repo.write('hello.txt', 'world');

      const result = await repo.git.run(add('.'), commit('initial'));

      expect(result.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(result.root).toBe(true);
      expect(repo.gitRaw('rev-parse', 'HEAD').trim()).toBe(result.commit);
   });

   it('lists exactly the requested tracked file via a pathspec', async () => {
      repo.write('a.txt', 'A');
      repo.write('b.txt', 'B');
      await repo.git.run(add('.'), commit('files'));

      expect(await repo.git.run(lsFiles(['a.txt']))).toEqual(['a.txt']);
   });

   it('reads binary content without utf-8 corruption', async () => {
      const bytes = Buffer.from([0, 1, 2, 253, 254, 255]);
      repo.write('blob.bin', bytes);
      await repo.git.run(add('.'), commit('binary'));

      const sha = repo.gitRaw('rev-parse', 'HEAD:blob.bin').trim();
      const output = await repo.git.run(catFileBuffer(['-p', sha]));

      expect(Buffer.isBuffer(output)).toBe(true);
      expect(output).toEqual(bytes);
   });

   it('normalises raw arguments and resolves a string', async () => {
      repo.write('x.txt', 'x');
      await repo.git.run(add('.'), commit('one'));

      expect((await repo.git.raw('rev-parse', '--abbrev-ref', 'HEAD')).trim()).toBe('main');
   });

   it('streams raw stdout chunks', async () => {
      repo.write('x.txt', 'x');
      await repo.git.run(add('.'), commit('one'));

      const stream = await repo.git.stream(version());
      let bytes = 0;
      for await (const chunk of stream) {
         bytes += chunk.length;
      }
      expect(bytes).toBeGreaterThan(0);
   });

   describe('deny-by-default security model', () => {
      it('rejects a guarded env var supplied via .env()', async () => {
         repo.git.env('GIT_SSH_COMMAND', 'ssh -i /tmp/evil');
         await expect(repo.git.raw('status', '--porcelain')).rejects.toBeInstanceOf(GitPluginError);
      });

      it('rejects an un-allow-listed config write', async () => {
         await expect(repo.git.raw('-c', 'core.pager=cat', 'log')).rejects.toBeInstanceOf(
            GitPluginError
         );
      });

      it('permits the blessed internal config write performed by commit', async () => {
         repo.write('c.txt', 'c');
         await expect(repo.git.run(add('.'), commit('blessed ok'))).resolves.toMatchObject({
            root: true,
         });
      });
   });
});
