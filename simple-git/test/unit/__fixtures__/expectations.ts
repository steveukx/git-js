import { mockChildProcessModule } from '../__mocks__/mock-child-process';

export function assertTheBuffer(actual: Buffer | unknown, content?: string) {
   expect(Buffer.isBuffer(actual)).toBe(true);
   if (typeof content === 'string') {
      expect((actual as Buffer).toString('utf8')).toBe(content);
   }
}

export function assertExecutedTasksCount(count: number) {
   expect(mockChildProcessModule.$allCommands()).toHaveLength(count);
}

export function assertNoExecutedTasks() {
   return assertExecutedTasksCount(0);
}

export function assertAllExecutedCommands(...commands: string[][]) {
   expect(mockChildProcessModule.$allCommands()).toEqual(commands);
}

export function assertExecutedCommands(...commands: string[]) {
   expect(mockChildProcessModule.$mostRecent().$args).toEqual(commands);
}

export function assertExecutedCommandsContains(command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.indexOf(command)).not.toBe(-1);
}

export function assertExecutedCommandsContainsOnce(command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.filter((c) => c === command)).toHaveLength(1);
}

export function assertChildProcessEnvironmentVariables(env: any) {
   expect(mockChildProcessModule.$mostRecent()).toHaveProperty('$env', env);
}

export function assertChildProcessSpawnOptions(options: any) {
   expect(mockChildProcessModule.$mostRecent().$options).toMatchObject(options);
}
