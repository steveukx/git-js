import { expect } from 'vitest';

import type { ConfigRead, ConfigWrite, ParsedFlag } from '../../src/args/parse-argv.types';
import type { VulnerabilityCategory } from '../../src/vulnerabilities/vulnerability.types';

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

/** A write made by `git config` with a value, which records whether it renames a section */
export function aConfigSet(
   key: string,
   scope: ConfigWrite['scope'],
   value: string,
   rename = false
): ConfigWrite {
   return { key, scope, value, rename };
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
