import expect = require('expect');
import { SinonSandbox, createSandbox } from 'sinon';
import { simpleGitBuilder, SimpleGit } from '../../src';
import dependencies from '../../src/util/dependencies';

describe('stash', () => {

   let sandbox: SinonSandbox;
   let git: SimpleGit;

   let childProcess: any;

   function theCommandRun () {
      return childProcess && childProcess.$args;
   }

   beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(dependencies, 'buffer').returns({
         from () {},
         concat (data: any[]) {
            return {
               isBuffer: true,
               data,
               toString () { return data.join('\n'); }
            }
         },
      });

      sandbox.stub(dependencies, 'childProcess').returns({
         spawn($binary: string, $args: string[], $options: any) {
            const $events: {[key: string]: any[]} = {};

            const addEvent = (type: string, handler: any) => {
               ($events[type] = $events[type] || []).push(handler);
            };

            const runHandlers = (type: string, data: any) => {
               $events.hasOwnProperty(type) && $events[type].forEach(handler => handler(data));
            };

            return childProcess = {
               $binary,
               $args,
               $options,

               $closeWith (data = '', exitCode = 0) {
                  runHandlers('stdout', data);
                  runHandlers('exit', exitCode);
               },

               on: sandbox.spy((event, handler) => addEvent(event, handler)),
               stdout: { on: sandbox.spy((type, handler) => addEvent('stdout', handler)) },
               stderr: { on: sandbox.spy((type, handler) => addEvent('stderr', handler)) },
            }
         }
      });
      git = simpleGitBuilder();
   });

   afterEach(() => sandbox.restore());

   it('stash working directory', () => {
      git.stash();
      expect(theCommandRun()).toEqual(['stash']);
   });

   it('stash pop', (done: (err: any) => void) => {
      git.stash(['pop'], (err) => {
         expect(theCommandRun()).toEqual(['stash', 'pop']);
         done(err);
      });

      childProcess.$closeWith();
   });

   it('stash with options no handler', () => {
      git.stash(['branch', 'some-branch']);

      childProcess.$closeWith();
      expect(['stash', 'branch', 'some-branch']).toEqual(theCommandRun());
   });

});
