import { GitTask } from '../tasks';
import { OutputLogger } from '../git-logger';
import { spawn, SpawnOptions } from 'node:child_process';
import type { GitExecutorEnv, GitExecutorResult, Maybe } from '../types';
import type { TaskContext, TeardownStep } from '../pipeline/types';
import type { TaskPipeline } from '../pipeline/pipeline';

export function executeRemoteTask<R>(
   task: GitTask<R>,
   command: string,
   args: string[],
   pipeline: TaskPipeline,
   context: TaskContext,
   cwd: string,
   env: GitExecutorEnv,
   logger: OutputLogger
): Promise<GitExecutorResult> {
   const outputLogger = logger.sibling('output');
   const spawnOptions: SpawnOptions = pipeline.spawnOptions(
      {
         cwd,
         env,
         windowsHide: true,
      },
      context
   );

   return new Promise((done, fail) => {
      const stdOut: Buffer[] = [];
      const stdErr: Buffer[] = [];
      let rejection: Maybe<Error>;

      logger.info(`%s %o`, command, args);
      logger('%O', spawnOptions);

      try {
         pipeline.beforeSpawn(
            { binary: command, args, options: spawnOptions },
            context,
            (reason) => {
               rejection = reason || rejection;
            }
         );
      } catch (e) {
         return fail(e as Error);
      }

      if (rejection) {
         return done({
            stdOut,
            stdErr,
            exitCode: 9901,
            rejection,
         });
      }

      // branded String-object arguments (eg trusted config injections)
      // have served their purpose once `beforeSpawn` has run - the child
      // process and any output handler receive primitive strings
      const finalArgs = args.map(String);

      const spawned = spawn(command, finalArgs, spawnOptions);

      spawned.stdout!.on(
         'data',
         onDataReceived(stdOut, 'stdOut', logger, outputLogger.step('stdOut'))
      );
      spawned.stderr!.on(
         'data',
         onDataReceived(stdErr, 'stdErr', logger, outputLogger.step('stdErr'))
      );

      spawned.on('error', onErrorReceived(stdErr, logger));

      const teardowns: TeardownStep[] = pipeline.onSpawned(
         spawned,
         { ...context, command },
         {
            close(exitCode: number, reason?: Error) {
               runTeardowns();
               done({
                  stdOut,
                  stdErr,
                  exitCode,
                  rejection: rejection || reason,
               });
            },
            kill(reason: Error) {
               if (spawned.killed) {
                  return;
               }

               rejection = reason;
               spawned.kill('SIGINT');
            },
         }
      );

      function runTeardowns() {
         teardowns.splice(0).forEach((teardown) => teardown());
      }

      function onDataReceived(
         target: Buffer[],
         name: 'stdOut' | 'stdErr',
         logger: OutputLogger,
         output: OutputLogger
      ) {
         return (buffer: Buffer) => {
            logger(`%s received %L bytes`, name, buffer);
            output(`%B`, buffer);

            task.onStream?.({ name, buffer });

            // a streamed task consumes stdOut through its iterator - also
            // accumulating it would defeat the point of streaming; stdErr is
            // always kept, error detection and reporting depend on it
            if (!task.onStream || name === 'stdErr') {
               target.push(buffer);
            }
         };
      }
   });
}

function onErrorReceived(target: Buffer[], logger: OutputLogger) {
   return (err: Error) => {
      logger(`[ERROR] child process exception %o`, err);
      target.push(Buffer.from(String(err.stack), 'ascii'));
   };
}
