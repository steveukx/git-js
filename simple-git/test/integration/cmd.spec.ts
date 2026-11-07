import { promiseError } from '@kwsites/promise-result';
import { assertGitError } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { pathspec, refName, remoteUrl, TaskConfigurationError } from '../..';
import { createAdvisoryContext } from './advisories/advisory-context';

describe('git.cmd', () => {
   it('clones, branches and commits using untrusted values', async () => {
      const poc = await createAdvisoryContext();
      const source = await poc.source();
      const git = poc.git();

      await git.cmd`clone ${remoteUrl(source)} ${pathspec('dest')}`;

      const dest = poc.git({ baseDir: poc.context.path('poc-workdir', 'dest') });
      await dest.cmd`checkout -b ${refName('feature/untrusted')}`;
      await dest.cmd`-c user.name=${'Some; One'} -c user.email=${'a@b.c'} commit --allow-empty --message=${'$(touch pwned)'}`;

      expect(await dest.cmd`log -n ${1} --format=%an:%s`).toBe('Some; One:$(touch pwned)\n');
      expect(poc.pwned()).toBe(false);
   });

   it('blocks the upload-pack injection from untrusted JSON', async () => {
      const poc = await createAdvisoryContext();
      const source = await poc.source();
      const input = JSON.parse(JSON.stringify({ options: `--upload-pack=${poc.touch};` }));

      const err = await promiseError(poc.git().cmd`clone ${input.options} ${source} dest`);

      assertGitError(err, 'would be read as an option', TaskConfigurationError);
      expect(poc.pwned()).toBe(false);
   });

   it('blocks the ext:: transport from untrusted input', async () => {
      const poc = await createAdvisoryContext();
      const url = `ext::sh -c ${poc.touch.replace(/ /g, '% ')}% >&2`;

      const err = await promiseError(
         poc.git({ allowConfig: ['protocol.*'] })
            .cmd`-c protocol.ext.allow=always clone ${url} dest`
      );

      assertGitError(err, 'remote helper transport', TaskConfigurationError);
      expect(poc.pwned()).toBe(false);
   });
});
