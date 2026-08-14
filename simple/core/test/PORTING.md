# v3 test-suite port ledger

The `simple-git` v3 test suite is the backward-compatibility acceptance gate for
`@simple-git/core` (core-package-plan §0.1). This file records how each v3 spec
was ported and every deviation, so the port can be audited against the rule that
**only** two categories of change are permitted beyond a straight port:

1. Tests that _exclusively_ exercise the `gitP` wrapper / `require('.../promise')`
   entry point (not implemented).
2. Tests that _exclusively_ exercise **trailing callback function** arguments
   (not implemented — passing a function now throws `TaskConfigurationError`).

Plus the expected behavioural opt-ins for the intentional §4 differences
(deny-by-default environment and config-write guards), which core-package-plan
§0.1 explicitly classifies as normal porting, not a gate exception.

## Coverage baseline

Post-port coverage (`yarn workspace @simple-git/core test`): **96% lines /
95% branches / 95% functions** across 771 tests (99 files). The 80% gate in
`vite.config.ts` is in force.

## Runner conversion (applies to every ported spec)

- `jest.fn` → `vi.fn`, `jest.Mock` → `Mock`, `jest.spyOn`/timers → `vi.*`.
- `child_process` singleton mock registered via `vi.mock('node:child_process',
  …)` in `test/setup.ts` (unit project only); `debug` and `@kwsites/file-exists`
  mocked there too.
- Imports repointed from v3's `typings` / `src/lib/*` / `@simple-git/test-utils`
  to `@simple-git/core`'s public barrel, `src/*`, and `test/__fixtures__/*`.
- Real-git integration harness (`createTestContext`, `setUpInit`, …) copied into
  `test/__fixtures__/` rather than importing `@simple-git/test-utils` (which
  binds to the v3 package).

## Dropped specs (carve-out 1 — gitP)

| v3 spec | Disposition | Replacement guard |
| --- | --- | --- |
| `test/integration/promise.spec.ts` | Dropped — exclusively `gitP` | No `@simple-git/core/promise` entry exists; the package is promise-based directly. |
| `test/integration/promise-from-root.spec.ts` | Dropped — exclusively `gitP` | As above. |

`test/unit/promises.spec.ts` and the deprecation block of `test/unit/git.spec.ts`
were **not** ported wholesale: they mix `gitP` and trailing-callback assertions
with no retained-behaviour unique to them (the promise-based equivalents are
covered by every other command spec). The trailing-callback **guard** itself is
asserted in `test/unit/bindings.spec.ts` (`throws for sugar methods`, `throws for
run / raw / stream`, `exec and outputHandler still accept function payloads`).

## Split specs (carve-out 2 — trailing callbacks)

Trailing-callback `it`/`describe` blocks were removed from the command specs
where they were a pure callback variant of an adjacent promise test (the retained
promise assertions stay). Where a callback was woven into a test that also
asserts command execution, the callback argument/assertion was stripped and the
command assertion kept. Representative bespoke rewrites:

| Spec | Change |
| --- | --- |
| `test/integration/change-directory.spec.ts` | `chained with callbacks` dropped; happy/sad-path promise tests retain cwd success/failure. |
| `test/integration/exec.spec.ts` | `raw(cmd, callback)` interleaving rewritten to use `exec(fn)` between chained tasks. |
| `test/unit/git-executor.spec.ts` | Completion-detection observed through the returned promise instead of a callback. |
| `test/unit/mv.spec.ts`, `test/unit/output-handler.spec.ts` | Rewritten to promise/`outputHandler`-function form (titles happened to contain "callback"). |

## Behavioural opt-ins (§4 intentional differences — not gate exceptions)

| Spec | Change |
| --- | --- |
| `test/unit/config.spec.ts`, `test/integration/config.spec.ts` | `addConfig` writes opt in via `allowConfigWrite` (§2.7b). |
| `test/unit/clone.spec.ts` | `git clone --config http.extraheader=…` opts in via `allowConfigWrite`. |
| `test/unit/child-process.spec.ts` | Env assertions updated for the inherit-ambient-then-filter model (§2.7a / §4.5) — the child receives `process.env` merged with `.env()` values, not `undefined`. |
| `test/integration/plugin.unsafe.spec.ts` | `unsafe.*` opt-ins additionally require `allowConfigWrite` for the config-write surface — the guards compose (§2.7). |
| `test/__fixtures__/integration.ts` | The integration `newSimpleGit` allow-lists the test-harness keys (`init.defaultbranch`, `user.name`, `user.email`) by default; keys exercised by the guard tests are not in that list and stay blocked. |

## Notes

- `test/integration/check-ignore.win32.spec.ts` is Windows-only; it is run via
  the `test:win` script, not the default `test` run.
- No `.skip` / `.todo` tests were introduced — every ported spec is green.
