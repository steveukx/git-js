import { LineParser, parseStringResponse } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

describe('LineParser / parseStringResponse', () => {
   it('feeds captured groups into the result', () => {
      const parser = new LineParser<{ name: string }>(/^name: (.+)$/, (result, [name]) => {
         result.name = name;
      });

      const result = parseStringResponse({ name: '' }, [parser], 'name: Steve');
      expect(result.name).toBe('Steve');
   });

   it('matches across consecutive lines via the offset reader', () => {
      const parser = new LineParser<string[]>([/^a (\w+)$/, /^b (\w+)$/], (result, matches) => {
         result.push(...matches);
      });

      const result = parseStringResponse<string[]>([], [parser], 'a one\nb two');
      expect(result).toEqual(['one', 'two']);
   });

   it('skips blank lines and lets the first matching parser win', () => {
      const calls: string[] = [];
      const first = new LineParser<string[]>(/^x (\w+)$/, (result, [value]) => {
         calls.push('first');
         result.push(value);
      });
      const second = new LineParser<string[]>(/^x (\w+)$/, () => {
         calls.push('second');
      });

      parseStringResponse<string[]>([], [first, second], '\n\nx hit\n\n');
      expect(calls).toEqual(['first']);
   });
});
