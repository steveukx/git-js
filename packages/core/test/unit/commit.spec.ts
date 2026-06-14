import { commit, isBlessedConfig, parseCommitResult } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('commit (arguments)', () => {
   it('builds the command with a blessed core.abbrev and -m message', () => {
      const task = commit('a message');
      expect(task.commands.map(String)).toEqual([
         '-c',
         'core.abbrev=40',
         'commit',
         '-m',
         'a message',
      ]);
   });

   it('marks the injected -c value as blessed, not a caller config write', () => {
      const task = commit('msg');
      expect(task.commands[0]).toBe('-c');
      expect(isBlessedConfig(task.commands[1])).toBe(true);
   });

   it('passes files and a trailing options object through', () => {
      const task = commit(['line one', 'line two'], ['a.txt', 'b.txt'], { '--amend': null });
      expect(task.commands.map(String)).toEqual([
         '-c',
         'core.abbrev=40',
         'commit',
         '-m',
         'line one',
         '-m',
         'line two',
         'a.txt',
         'b.txt',
         '--amend',
      ]);
   });
});

describe('parseCommitResult', () => {
   it('reads the branch, root flag, hash and summary', () => {
      const result = parseCommitResult(
         '[main (root-commit) 1234567] initial\n 1 file changed, 1 insertion(+)'
      );
      expect(result).toMatchObject({
         branch: 'main',
         root: true,
         commit: '1234567',
         summary: { changes: 1, insertions: 1 },
      });
   });
});
