import type { ParsedArgv, ParsedFlag } from '..';
import { parseArgv } from '..';
import { describe, expect, it } from 'vitest';
import { aWriteConfig } from './__fixtures__/mocks';

function aParsedFlag(name: string, value?: string): ParsedFlag {
   return value !== undefined ? { name: name, value } : { name: name };
}

describe('full ParsedArgv shape', () => {
   it('simple commit', () => {
      expect(parseArgv('commit', '-m', 'initial')).toEqual<ParsedArgv>({
         task: 'commit',
         flags: [aParsedFlag('-m', 'initial')],
         paths: [],
         config: { write: [], read: [] },
         vulnerabilities: [],
      });
   });

   it('push with force', () => {
      expect(parseArgv('push', 'origin', 'main', '--force')).toEqual<ParsedArgv>({
         task: 'push',
         flags: [aParsedFlag('--force')],
         paths: [],
         config: { write: [], read: [] },
         vulnerabilities: [],
      });
   });

   it('bare status', () => {
      expect(parseArgv('status')).toEqual<ParsedArgv>({
         task: 'status',
         flags: [],
         paths: [],
         config: { write: [], read: [] },
         vulnerabilities: [],
      });
   });

   it('empty token list', () => {
      expect(parseArgv()).toEqual<ParsedArgv>({
         task: null,
         flags: [],
         paths: [],
         config: { write: [], read: [] },
         vulnerabilities: [],
      });
   });

   it('inline write + config command write are independent entries', () => {
      const result = parseArgv(
         '-c',
         'http.proxy=http://proxy:3128',
         'config',
         '--global',
         'user.name',
         'Steve'
      );
      expect(result.config.write).toEqual([
         aWriteConfig('http.proxy', 'inline', 'http://proxy:3128'),
         aWriteConfig('user.name', 'global', 'Steve', false),
      ]);
      expect(result.config.read).toEqual([]);
   });
});
