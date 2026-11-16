import { expect } from 'vitest';

import type { ConfigRead, ConfigWrite, ParsedFlag } from '../../src/args/parse-argv.types';
import type {
   VulnerabilityCategory,
   VulnerabilityLevel,
} from '../../src/vulnerabilities/vulnerability.types';

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

export function aVulnerability(
   category: VulnerabilityCategory,
   level: VulnerabilityLevel = 'default'
) {
   return expect.objectContaining({
      category,
      level,
      message: expect.stringContaining(`enabling ${category}`),
   });
}

export function oneVulnerability(
   category: VulnerabilityCategory,
   level: VulnerabilityLevel = 'default'
) {
   return [aVulnerability(category, level)];
}

export function noVulnerabilities() {
   return [];
}
