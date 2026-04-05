import type { ConfigRead, ConfigWrite, ParsedFlag } from '../../src/parse-argv.types';

export function aParsedFlag(name: string, value?: string): ParsedFlag {
   return value !== undefined ? { name: name, value } : { name: name };
}

export function aWriteConfig(
   key: string,
   scope: ConfigWrite['scope'],
   value?: string
): ConfigWrite {
   return value !== undefined ? { key, scope, value } : { key, scope };
}

export function aReadConfig(key: string, scope: ConfigRead['scope']): ConfigRead {
   return { key, scope };
}
