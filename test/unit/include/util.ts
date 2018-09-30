import { Runner } from '../../../src/interfaces/command-runner';
import createSpy = jasmine.createSpy;
import { SimpleGit } from '../../../src';
import Spy = jasmine.Spy;

export const test = {

   same (actual: any, expected: any) {
      expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
   },

   equal (actual: any, expected: any, reason?: string) {
      expect(actual).toBe(expected, reason);
   },

   equals (actual: any, expected: any, reason?: string) {
      expect(actual).toEqual(expected, reason);
   },

   deepEqual (actual: any, expected: any, reason?: string) {
      expect(actual).toEqual(expected, reason);
   },

   ok(actual: boolean) {
      expect(actual).toBe(true);
   },

   /**
    * @Deprecated
    */
   done () {},

};

export class MockRunner implements Runner {

   public run = createSpy('run').and.callFake(this._run);

   private _commands: Array<{done: (content: string) => void, fail: any, handled: boolean}> = [];
   private _responses: string[] = [];

   private _run () {
      return new Promise((done, fail) => {
         const index = this._commands.push({
            done,
            fail,
            handled: false
         });

         this._handle(index - 1);
      });
   }

   private _handle (index: number) {
      if (index >= this._commands.length || index >= this._responses.length || this._commands[index].handled) {
         return;
      }

      const command = this._commands[index];
      command.handled = true;
      command.done(this._responses[index]);
   }

   public respondWith (content: string) {
      this._handle(this._responses.push(content) - 1);
   }

}

export interface TestHelper {
   readonly git: SimpleGit;
   theCommandRun: (index?: number) => any[];
   closeWith: (content: string) => void;
}

export function setup (runner: Runner = new MockRunner()): TestHelper {

   if (!isMockRunner(runner)) {
      spyOn(runner, 'run').and.callThrough();
   }

   const instance: SimpleGit = new SimpleGit(runner);

   return {
      get git () {
         return instance;
      },

      theCommandRun (index = 0) {
         return (<Spy>runner.run).calls.argsFor(index)[0];
      },

      closeWith (content: string) {
         if (!isMockRunner(runner)) {
            throw new Error(`closeWith can only be used with a mock runner`);
         }

         runner.respondWith(content);
      }
   };


}

function isMockRunner (test: Runner): test is MockRunner {
   return test instanceof MockRunner;
}
