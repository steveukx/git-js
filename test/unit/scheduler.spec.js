const {restore, newSimpleGit, theChildProcessMatching, closeWithSuccess, theCommandsRun, wait} = require('./include/setup');

const {Scheduler} = require('../../src/lib/runners/scheduler');

describe('scheduler', () => {

   describe('in isolation', () => {

      let mocks;

      beforeEach(() => {
         const first = jest.fn(), second = jest.fn(), third = jest.fn(), fourth = jest.fn();
         mocks = Object.assign([ first, second, third, fourth ], { first, second, third, fourth });
      })

      it('limits the number of async operations', async () => {
         const {third, fourth} = mocks;
         const scheduler = new Scheduler(2);

         const first = await scheduler.next();
         const second = await scheduler.next();

         scheduler.next().then(third);
         scheduler.next().then(fourth);

         await wait();
         assertCallsTo(third, fourth).are(0, 0);

         await first(); // first will trigger third task
         assertCallsTo(third, fourth).are(1, 0);

         await first(); // subsequent does nothing
         assertCallsTo(third, fourth).are(1, 0);

         await second();
         assertCallsTo(third, fourth).are(1, 1);
      });

      it('progresses to next task only when previous tasks are done', async () => {
         const scheduler = new Scheduler(2);
         const initial = await Promise.all([scheduler.next(), scheduler.next()]);
         const pending = mocks.map(async (mock) => {
            const next = await scheduler.next();
            mock();
            return next;
         });
         assertCallsTo(...mocks).are(0, 0, 0, 0);

         await initial.forEach(task => task());
         assertCallsTo(...mocks).are(1, 1, 0, 0);

         const running = await Promise.all(pending.splice(0, 2));
         await running.forEach(task => task());
         assertCallsTo(...mocks).are(1, 1, 1, 1);
      });
   });

   describe('in simpleGit', () => {

      let git;

      beforeEach(() => git = newSimpleGit({maxConcurrentProcesses: 2}));

      it('shares a scheduler between chains', async () => {
         ['a', 'b', 'c'].forEach(char => git.raw(char).then(() => git.raw(char.toUpperCase())));
         await wait();

         // a, b and c all tried at the same time, c is waiting behind a & b
         expect(theCommandsRun()).toEqual([['a'], ['b']]);

         // the first of a & b to resolve allows c to start
         await theChildProcessMatching(['a']).closeWithSuccess();
         expect(theCommandsRun()).toEqual([['a'], ['b'], ['c']]);

         // until b resolves, one of the concurrent process slots is taken up
         // so when c resolves it allows the now queued A to start
         await theChildProcessMatching(['c']).closeWithSuccess();
         expect(theCommandsRun()).toEqual([['a'], ['b'], ['c'], ['A']]);
      });

   });

   function assertCallsTo (...srcMocks) {
      return {
         are (...counts) {
            expect(srcMocks.length).toBe(counts.length);
            srcMocks.forEach((m, i) => expect(m).toHaveBeenCalledTimes(counts[i]));
         }
      }
   }

});

