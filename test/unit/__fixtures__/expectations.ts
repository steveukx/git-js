import { mockChildProcessModule } from '../__mocks__/mock-child-process';

export function assertExecutedCommands (...commands: string[]) {
   expect(mockChildProcessModule.$mostRecent().$args).toEqual(commands);
}

export function assertExecutedCommandsContains (command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.indexOf(command)).not.toBe(-1);
}

export function theCommandRun () {
   return [...mockChildProcessModule.$mostRecent().$args];
}
