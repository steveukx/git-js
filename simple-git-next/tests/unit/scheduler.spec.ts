import {
   assertAllExecutedCommands,
   newSimpleGit,
   theChildProcessMatching,
   wait,
} from './__fixtures__';
import { SimpleGit } from '../../typings';
import { Scheduler } from '../../src/lib/runners/scheduler';

describe('scheduler', () => {
   describe('in isolation', () => {
      let mocks: Map<string, jest.Mock>;
      let first: jest.Mock;
      let second: jest.Mock;
      let third: jest.Mock;
      let fourth: jest.Mock;

      beforeEach(() => {
         mocks = new Map([
            ['first', (first = jest.fn().mockName('first'))],
            ['second', (second = jest.fn().mockName('second'))],
            ['third', (third = jest.fn().mockName('third'))],
            ['fourth', (fourth = jest.fn().mockName('fourth'))],
         ]);
      });

      it('limits the number of async operations', async () => {
         const scheduler = new Scheduler(2);

         const x = await scheduler.next();
         const y = await scheduler.next();

         scheduler.next().then(third);
         scheduler.next().then(fourth);

         await wait();
         assertCallsTo(third, fourth).are(0, 0);

         await x(); // x will trigger third task
         assertCallsTo(third, fourth).are(1, 0);

         await x(); // subsequent does nothing
         assertCallsTo(third, fourth).are(1, 0);

         await y();
         assertCallsTo(third, fourth).are(1, 1);
      });

      it('progresses to next task only when previous tasks are done', async () => {
         const scheduler = new Scheduler(2);
         const initial = await Promise.all([scheduler.next(), scheduler.next()]);
         const pending = Array.from(mocks.values(), async (mock) => {
            const next = await scheduler.next();
            mock();
            return next;
         });
         assertCallsTo(first, second, third, fourth).are(0, 0, 0, 0);

         initial.forEach((task) => task());
         await wait();

         assertCallsTo(first, second, third, fourth).are(1, 1, 0, 0);

         const running = await Promise.all(pending.splice(0, 2));
         running.forEach((task) => task());
         await wait();

         assertCallsTo(first, second, third, fourth).are(1, 1, 1, 1);
      });
   });

   describe('in simpleGit', () => {
      let git: SimpleGit;

      beforeEach(() => (git = newSimpleGit({ maxConcurrentProcesses: 2 })));

      it('shares a scheduler between chains', async () => {
         ['a', 'b', 'c'].forEach((char) => git.raw(char).then(() => git.raw(char.toUpperCase())));
         await wait();

         // a, b and c all tried at the same time, c is waiting behind a & b
         assertAllExecutedCommands(['a'], ['b']);

         // the first of a & b to resolve allows c to start
         await theChildProcessMatching(['a']).closeWithSuccess();
         assertAllExecutedCommands(['a'], ['b'], ['c']);

         // until b resolves, one of the concurrent process slots is taken up
         // so when c resolves it allows the now queued A to start
         await theChildProcessMatching(['c']).closeWithSuccess();
         assertAllExecutedCommands(['a'], ['b'], ['c'], ['A']);
      });
   });

   function assertCallsTo(...srcMocks: jest.Mock[]) {
      return {
         are(...counts: number[]) {
            expect(srcMocks.length).toBe(counts.length);
            srcMocks.forEach((m, i) => expect(m).toHaveBeenCalledTimes(counts[i]));
         },
      };
   }
});
