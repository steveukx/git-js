import type { ChildProcess } from 'node:child_process';

import { GitError } from '../../src/errors';
import { TaskPipeline } from '../../src/pipeline/pipeline';
import {
   errorDetectionHandler,
   errorDetectionStep,
} from '../../src/pipeline/steps/error-detection.step';
import type { PipelineStep, TaskContext } from '../../src/pipeline/types';
import type { GitExecutorResult } from '../../src/types';

const context: TaskContext = {
   method: 'commit',
   commands: ['commit', '-m', 'message'],
   env: {},
};

function result(overrides: Partial<GitExecutorResult> = {}): GitExecutorResult {
   return {
      stdOut: [],
      stdErr: [],
      exitCode: 0,
      rejection: undefined,
      ...overrides,
   };
}

describe('TaskPipeline', () => {
   it('exposes step names in registration order', () => {
      const pipeline = new TaskPipeline([{ name: 'first' }, { name: 'second' }]);
      expect(pipeline.stepNames()).toEqual(['first', 'second']);
   });

   it('reduces args through steps in registration order', () => {
      const pipeline = new TaskPipeline([
         { name: 'prefix', args: (args) => ['-c', 'a=b', ...args] },
         { name: 'suffix', args: (args) => [...args, '--'] },
      ]);

      expect(pipeline.args(['status'], context)).toEqual(['-c', 'a=b', 'status', '--']);
   });

   it('reduces binary and spawn options, skipping steps without the stage', () => {
      const pipeline = new TaskPipeline([
         { name: 'noop' },
         { name: 'binary', binary: () => ({ binary: 'wsl', prefix: ['git'] }) },
         { name: 'options', spawnOptions: (options) => ({ ...options, uid: 1 }) },
      ]);

      expect(pipeline.binary({ binary: 'git', prefix: [] }, context)).toEqual({
         binary: 'wsl',
         prefix: ['git'],
      });
      expect(pipeline.spawnOptions({ cwd: '/tmp' }, context)).toEqual({ cwd: '/tmp', uid: 1 });
   });

   it('beforeSpawn steps run in order and can record a kill reason', () => {
      const order: string[] = [];
      const reason = new Error('blocked');
      const pipeline = new TaskPipeline([
         { name: 'one', beforeSpawn: () => void order.push('one') },
         { name: 'two', beforeSpawn: (_detail, _context, kill) => kill(reason) },
         { name: 'three', beforeSpawn: () => void order.push('three') },
      ]);

      let killedWith: Error | undefined;
      pipeline.beforeSpawn({ binary: 'git', args: [], options: {} }, context, (reason) => {
         killedWith = reason;
      });

      expect(order).toEqual(['one', 'three']);
      expect(killedWith).toBe(reason);
   });

   it('collects teardown functions from onSpawned steps and runs them via close', () => {
      const torndown: string[] = [];
      const pipeline = new TaskPipeline([
         { name: 'with-teardown', onSpawned: () => () => void torndown.push('with-teardown') },
         { name: 'without-teardown', onSpawned: () => undefined },
      ]);

      const teardowns = pipeline.onSpawned({} as ChildProcess, context, { close() {}, kill() {} });
      expect(teardowns).toHaveLength(1);

      teardowns.forEach((teardown) => teardown());
      expect(torndown).toEqual(['with-teardown']);
   });

   it('threads errors through onError steps', () => {
      const swallow: PipelineStep = { name: 'swallow', onError: () => undefined };
      const replace: PipelineStep = { name: 'replace', onError: () => new Error('replaced') };

      expect(
         new TaskPipeline([replace, swallow]).onError(new Error('original'), result(), context)
      ).toBeUndefined();
      expect(
         new TaskPipeline([swallow, replace]).onError(new Error('original'), result(), context)
      ).toEqual(new Error('replaced'));
   });
});

describe('errorDetection', () => {
   it('treats a non-zero exit with stdErr content as an error', () => {
      const handler = errorDetectionHandler();

      expect(
         handler(undefined, result({ exitCode: 1, stdErr: [Buffer.from('fatal: bad')] }))
      ).toEqual(Buffer.from('fatal: bad'));
      expect(handler(undefined, result({ exitCode: 1 }))).toBeUndefined();
      expect(
         handler(undefined, result({ exitCode: 0, stdErr: [Buffer.from('warning')] }))
      ).toBeUndefined();
   });

   it('keeps an existing error unless overwrite is enabled', () => {
      const existing = new Error('existing');
      const errored = result({ exitCode: 1, stdErr: [Buffer.from('detail')] });

      expect(errorDetectionHandler()(existing, errored)).toBe(existing);
      expect(errorDetectionHandler(true)(existing, errored)).toEqual(Buffer.from('detail'));
   });

   it('the step converts buffers to GitError and passes errors through', () => {
      const step = errorDetectionStep(errorDetectionHandler());
      const detected = step.onError!(
         undefined,
         result({ exitCode: 128, stdErr: [Buffer.from('fatal: not a repository')] }),
         context
      );

      expect(detected).toBeInstanceOf(GitError);
      expect(detected!.message).toBe('fatal: not a repository');

      const existing = new GitError(undefined, 'existing');
      expect(step.onError!(existing, result(), context)).toBe(existing);
   });

   it('supports a custom name for ordering assertions', () => {
      expect(errorDetectionStep(errorDetectionHandler()).name).toBe('errorDetection');
      expect(errorDetectionStep(errorDetectionHandler(), 'errorDetectionUser').name).toBe(
         'errorDetectionUser'
      );
   });
});
