import { parseVersion, version } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('version', () => {
   it('builds the --version descriptor', () => {
      const task = version();
      expect(task.commands).toEqual(['--version']);
      expect(task.format).toBe('utf-8');
   });

   it('parses a standard version string', () => {
      const result = parseVersion('git version 2.43.0');
      expect(result).toMatchObject({ major: 2, minor: 43, patch: 0, installed: true });
      expect(`${result}`).toBe('2.43.0');
   });

   it('captures the agent suffix', () => {
      const result = parseVersion('git version 2.40.1 (Apple Git-143)');
      expect(result).toMatchObject({ major: 2, minor: 40, patch: 1, agent: 'Apple Git-143' });
   });

   it('tolerates a non-numeric patch', () => {
      const result = parseVersion('git version 2.40.GIT');
      expect(result).toMatchObject({ major: 2, minor: 40, patch: 'GIT' });
   });

   it('reports not-installed for the sentinel output', () => {
      const result = parseVersion('installed=false');
      expect(result).toMatchObject({ major: 0, minor: 0, patch: 0, installed: false });
   });

   it('recovers a not-installed result when the binary is missing', () => {
      const task = version();
      let recovered: Buffer | undefined;
      task.onError?.(
         { exitCode: -2, stdOut: Buffer.alloc(0), stdErr: Buffer.alloc(0) },
         new Error('not found'),
         (data) => {
            recovered = data;
         },
         (error) => {
            throw error;
         }
      );
      expect(recovered?.toString()).toBe('installed=false');
   });

   it('escalates any other error', () => {
      const task = version();
      const error = new Error('boom');
      expect(() =>
         task.onError?.(
            { exitCode: 128, stdOut: Buffer.alloc(0), stdErr: Buffer.alloc(0) },
            error,
            () => undefined,
            (failure) => {
               throw failure;
            }
         )
      ).toThrow(error);
   });
});
