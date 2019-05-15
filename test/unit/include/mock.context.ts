import { Context } from '../../../src/interfaces/context';
import { SinonStub, spy, stub } from 'sinon';
import { deferred } from '../../../src/util/deferred';

export function mockContext(
   baseDir = '/base/dir', command = 'git', env = null, outputHandler = undefined): Context {

   return {
      baseDir,
      command,
      env,
      outputHandler,
      exec: stub().returns(deferred().promise),
   }
}

export function mockContextWithResponse(success: string): Context {
   return {
      ...mockContext(),
      exec: stub().resolves(success),
   };
}
