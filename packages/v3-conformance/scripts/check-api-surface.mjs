// Drift gate for the public type surface (Layer 2 of the v4 type-safety plan).
//
// Regenerates the current public API surface of `simple-git` and compares it to
// the committed `api-surface.golden.txt`. Any difference fails CI. The intent is
// that EVERY change to the consumer-visible type surface shows up here and is
// consciously reconciled against:
//   - `removals.json`            — the two sanctioned v4 removals, and
//   - docs/v4/TYPE-SAFETY-AND-TEST-INTEGRITY.md — the expected-delta log.
//
// If a diff is intentional, update the golden with:
//   pnpm --filter @simple-git/v3-conformance run api:surface
// and record the reason in the expected-delta log so review can see it.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generator = path.join(__dirname, 'api-surface.mjs');
const goldenPath = path.join(__dirname, '..', 'api-surface.golden.txt');

// Default to the canonical published surface; overridable so a future workstream
// can point this at v4's generated declarations without editing the script.
const entry =
   process.argv[2] ?? path.join(__dirname, '..', '..', '..', 'simple-git', 'typings', 'index.d.ts');

const current = execFileSync('node', [generator, entry], { encoding: 'utf8' });
const golden = readFileSync(goldenPath, 'utf8');

if (current === golden) {
   process.stderr.write('✓ public type surface matches the committed golden\n');
   process.exit(0);
}

const currentLines = current.split('\n');
const goldenLines = golden.split('\n');
const goldenSet = new Set(goldenLines);
const currentSet = new Set(currentLines);

const removed = goldenLines.filter((l) => l && !currentSet.has(l));
const added = currentLines.filter((l) => l && !goldenSet.has(l));

process.stderr.write('✗ public type surface drifted from the committed golden\n\n');
if (removed.length) {
   process.stderr.write('REMOVED (present in v3 golden, gone now):\n');
   for (const l of removed) process.stderr.write(`  - ${l}\n`);
   process.stderr.write('\n');
}
if (added.length) {
   process.stderr.write('ADDED (new in current surface):\n');
   for (const l of added) process.stderr.write(`  + ${l}\n`);
   process.stderr.write('\n');
}
process.stderr.write(
   'Reconcile every line above against removals.json and the expected-delta log.\n' +
      'If intentional, regenerate the golden: pnpm --filter @simple-git/v3-conformance run api:surface\n'
);
process.exit(1);
