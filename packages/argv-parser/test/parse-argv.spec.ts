import type { ConfigWrite, ParsedArgv, ParsedFlag } from '..';
import { parseArgv } from '..';
import { describe, expect, it } from 'vitest';

function aParsedFlag(name: string, value?: string): ParsedFlag {
   return value !== undefined ? { name: name, value } : { name: name };
}

function aWriteConfig(
   key: string,
   scope: ConfigWrite['scope'],
   value?: string,
   rename?: boolean
): ConfigWrite {
   const config: ConfigWrite = { key, scope };
   if (value !== undefined) {
      config.value = value;
   }
   if (rename !== undefined) {
      config.rename = rename;
   }
   return config;
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
