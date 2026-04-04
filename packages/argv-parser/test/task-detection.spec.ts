import { describe, expect, it } from 'vitest';
import { parseArgv } from '@simple-git/argv-parser';

describe('task detection', () => {
   it('is null for an empty token list', () => {
      expect(parseArgv().task).toBeNull();
   });

   it('is null when only global flags are present', () => {
      expect(parseArgv('--version').task).toBeNull();
      expect(parseArgv('-v').task).toBeNull();
   });

   it('identifies a simple sub-command', () => {
      expect(parseArgv('commit', '-m', 'foo').task).toBe('commit');
   });

   it('is lowercased', () => {
      expect(parseArgv('COMMIT').task).toBe('commit');
   });

   it('is identified after any number of global switches', () => {
      expect(parseArgv('-c', 'key=val', 'push').task).toBe('push');
      expect(parseArgv('--no-pager', 'log', '--oneline').task).toBe('log');
      expect(parseArgv('-v', 'status').task).toBe('status');
   });

   it('is preserved for unknown sub-commands', () => {
      expect(parseArgv('rebase', '-i', 'HEAD~3').task).toBe('rebase');
      expect(parseArgv('bisect', 'start').task).toBe('bisect');
   });
});
