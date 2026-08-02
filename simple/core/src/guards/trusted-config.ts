/**
 * Branding for library-internal `-c key=value` injections (the same
 * mechanism `@simple-git/args-pathspec` uses to brand pathspec arguments).
 * Task factories inside `@simple-git/core` occasionally need to inject a
 * config override to shape git's output - eg `commit` injects
 * `core.abbrev=40` so the parsed commit hash is full length. Those writes are
 * library-authored constants, not caller data, so they are excused from the
 * deny-by-default `allowConfigWrite` gate.
 *
 * The brand is a `WeakSet` membership on a `String` wrapper object created
 * here - it cannot be forged from string input (JSON, argv, env), only by
 * code that can call `trustedConfig`, which is deliberately NOT exported from
 * the public barrel. The executor chain unwraps the `String` objects to
 * primitives immediately before spawning.
 */
// biome-ignore lint/complexity/noBannedTypes: <By design>
const trusted = new WeakSet<String>();

export function trustedConfig(configEntry: string): string {
   const wrapped = new String(configEntry);
   trusted.add(wrapped);
   return wrapped as string;
}

export function isTrustedConfig(value: unknown): boolean {
   return value instanceof String && trusted.has(value);
}

/**
 * Returns a primitive-string copy of the argv with trusted `-c value` pairs
 * removed - used by the config-write guard so only untrusted writes are
 * checked against the allow-list.
 */
export function withoutTrustedConfig(args: readonly string[]): string[] {
   const out: string[] = [];

   for (let i = 0; i < args.length; i++) {
      if (args[i] === '-c' && isTrustedConfig(args[i + 1])) {
         i++;
         continue;
      }
      out.push(String(args[i]));
   }

   return out;
}
