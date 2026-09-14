import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInstanceConfig } from '../../src/lib/utils';

describe('git', () => {
   afterEach(() => vi.clearAllMocks());

   describe('instance config', () => {
      it('provides default values', () => {
         expect(createInstanceConfig()).toEqual(
            expect.objectContaining({
               baseDir: expect.any(String),
               binary: 'git',
               maxConcurrentProcesses: expect.any(Number),
            })
         );
      });

      it('merges option objects', () => {
         expect(createInstanceConfig({ baseDir: 'a' }, { maxConcurrentProcesses: 5 })).toEqual(
            expect.objectContaining({ baseDir: 'a', maxConcurrentProcesses: 5 })
         );
      });

      it('prioritises to the right', () => {
         expect(
            createInstanceConfig(
               { maxConcurrentProcesses: 3 },
               { maxConcurrentProcesses: 5 },
               { maxConcurrentProcesses: 1 }
            )
         ).toEqual(expect.objectContaining({ maxConcurrentProcesses: 1 }));
      });

      it('ignores empty values', () => {
         const params: any = [undefined, { maxConcurrentProcesses: 3 }, undefined];
         expect(createInstanceConfig(...params)).toEqual(
            expect.objectContaining({ maxConcurrentProcesses: 3 })
         );
      });
   });
});
