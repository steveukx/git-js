/**
 * The "bless" pattern for trusted, simple-git-internal git config writes.
 *
 * v4 blocks every *caller-supplied* config write unless it matches
 * `allowConfigWrite`. A handful of tasks, however, need to set config on their
 * own command (e.g. `commit` runs with `-c core.abbrev=40`). Rather than punching
 * a global hole in the allow-list, a task wraps its own write with `blessConfig`,
 * producing a branded value the config-write guard recognises as pre-approved.
 *
 * The branding mirrors `@simple-git/args-pathspec`: the value is a boxed `String`
 * (so it survives in a `string[]` of command arguments and coerces back to its
 * primitive `key=value` at spawn time) tracked in a `WeakMap`, so only values
 * produced by `blessConfig` — never an attacker-supplied string — are trusted.
 */

export interface ConfigWriteIntent {
   key: string;
   value: string;
}

// biome-ignore lint/complexity/noBannedTypes: a boxed String is required to brand the value while keeping it usable as a command argument
const blessed = new WeakMap<String, ConfigWriteIntent>();

/** Marks a `key=value` config write as trusted, returning it as a command argument. */
export function blessConfig(key: string, value: string): string {
   const token = new String(`${key}=${value}`);
   blessed.set(token, { key, value });
   return token as unknown as string;
}

export function isBlessedConfig(value: unknown): boolean {
   return value instanceof String && blessed.has(value);
}

export function blessedConfigIntent(value: unknown): ConfigWriteIntent | undefined {
   return value instanceof String ? blessed.get(value) : undefined;
}

/**
 * A spreadable convenience preset for the common "set identity then commit" flow.
 * It is a shortcut into `allowConfigWrite`, **not** a safety judgement and **not**
 * an unconditional exemption.
 */
export const allowConfigWriteUser = ['user.name', 'user.email'] as const;
