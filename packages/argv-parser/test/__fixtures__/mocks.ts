import { expect } from 'vitest';

import type { ConfigRead, ConfigWrite, ParsedFlag } from '../../src/args/parse-argv.types';
import type { VulnerabilityCategory } from '../../src/vulnerabilities/vulnerability.types';

export function aParsedFlag(name: string, value?: string): ParsedFlag {
   return value !== undefined ? { name: name, value } : { name: name };
}

export function aWriteConfig(
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

export function aReadConfig(key: string, scope: ConfigRead['scope']): ConfigRead {
   return { key, scope };
}

export function aVulnerability(category: VulnerabilityCategory) {
   return expect.objectContaining({
      category,
      message: expect.stringContaining(`enabling ${category}`),
   });
}

export function oneVulnerability(category: VulnerabilityCategory) {
   return [aVulnerability(category)];
}

export function noVulnerabilities() {
   return [];
}
