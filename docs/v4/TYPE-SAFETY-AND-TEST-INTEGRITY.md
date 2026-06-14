# v4 — Type-safety & test-integrity plan

How we guarantee the v4 migration is a tooling/architecture change and **not** an unintended
behavioural or type-contract change. This is the operational backing for plan §0.1 ("every test
that exists today must still pass on v4").

It answers two questions:

1. **How do we ensure type safety between v3 and v4** (the analogue of "run the v3 test-suite
   against a built v4"), except where breaking changes are intended?
2. **How do we ensure no test change silently hides an unintended breaking change?**

## Locked decisions feeding this plan

| Question | Decision |
| --- | --- |
| Config-write guard scope | **User-originated config only.** simple-git's own injected `-c` (e.g. `commitTask`'s `-c core.abbrev=40`) is exempted via a per-task **"bless" helper** that marks those args as trusted. There is no global exemption list — blessing is ad-hoc and local to the task that needs it. |
| Behaviour oracle | A **separate monorepo package** (`@simple-git/v3-conformance`) holding the frozen v3 baseline + the v3 integration suite run black-box against built v4. **Removed** once a few v4 minors confirm parity. |
| Default security posture | **Strict env, seeded config presets.** `GIT_*`/`GitEnvKeys` stripped by default; `allowConfigWrite` is *seeded* with the identity preset so the basic "set identity → commit" flow works out of the box. |
| Types source of truth | **Convert the `.js` core to TS** so declarations/TSDoc generate from source; `typings/` becomes a thin generated barrel. |

## The four guard layers

### Layer 1 — Runtime behavioural oracle (the direct "v3 tests vs built v4")

- **Integration tests** are the black-box oracle: they only touch the public surface (real `git`
  via `newSimpleGit()`), so the **unmodified** v3 integration suite is run against the built v4
  `dist`, resolved through the package `exports` map (not `src`).
- It lives in `@simple-git/v3-conformance` so its deps stay separate from the source under
  refactor, and is deleted once parity is proven across early v4 minors.
- The **only** permitted differences are the cases enumerated in
  `packages/v3-conformance/removals.json` (gitP / `simple-git/promise`; trailing callbacks).
- **Unit tests are explicitly out of scope here** — they `vi.mock('child_process')` and import
  from `src`, so they are white-box. They are *ported* to vitest, not frozen, and their integrity
  is covered by Layers 2–4 instead.

### Layer 2 — Public type-surface golden (active now)

- `packages/v3-conformance/api-surface.golden.txt` is a normalised, order-independent snapshot of
  every consumer-visible symbol from `import ... from 'simple-git'`, captured from the v3
  hand-written typings **before any v4 change** (85 exported symbols at capture time).
- CI runs `api:check`, which regenerates the current surface and **fails on any diff**. Because
  v4 generates declarations from the converted TS core, this is where a parameter widening, a
  dropped overload, a renamed type, or an accidentally-removed export becomes visible **in
  review** as an explicit ± diff.
- Every diff is reconciled against `removals.json` + the expected-delta log below. A diff that is
  neither is an **unintended breaking change** and is treated as a bug, not rubber-stamped.
- Intentional changes update the golden via `api:surface` **and** add an entry to the
  expected-delta log.

### Layer 3 — Type-level assertions

- Expand the consumer packages with `expectTypeOf` (vitest-native) `.test-d.ts` for the contracts
  most likely to *silently* regress even when the golden's shape is unchanged:
  - the dual `thenable + chainable` return of sugar methods,
  - option-union acceptance (e.g. `clean(CleanOptions.FORCE, ['-x'])`),
  - response object shapes consumers destructure,
  - **negative** assertions: removed features (`gitP`, trailing callbacks) must no longer
    type-check.

### Layer 4 — Resolution correctness

- `attw` (`@arethetypeswrong/cli`) + `publint` against the new `exports`/`publishConfig` map, so
  the dual ESM+CJS rewrite cannot ship a surface that resolves types/runtime incorrectly under
  `node16`/`bundler`/etc.

## Test-integrity: not missing an unintended breaking change

The structural risk is that the single PR changes the **runner** and edits **assertions** (the
security model) at once, so the tests cannot be their own oracle. Layers 1–2 break that
dependency (independent runtime + type oracles). On top of them:

- **Coverage is necessary but not sufficient** — it proves a line *ran*, not that it was
  *asserted*. v8 and istanbul also instrument differently, so the 80% number is **re-baselined**
  on the runner switch rather than compared across instruments.
- **`expect.hasAssertions()` / `expect.assertions(n)` enforced.** The `vi.mock` hoisting rewrite
  of `mock-child-process` is the single most likely place to silently turn a test into a no-op
  (an `expect` inside a callback that never fires still "passes"). Assertion-count enforcement
  catches exactly that.
- **Lint-ban `.only` / `.skip` / `.todo` / empty test bodies** as CI failures, so no
  skipped-test backlog accrues (plan §0.1).
- **Machine-checkable removals manifest** (`removals.json`): CI diffs touched test files against
  the two sanctioned removals; anything else flags for review.
- **Optional — mutation testing (Stryker)** scoped to the two new security plugins
  (`environmentFilterPlugin`, `configWriteGuardPlugin`). They are deny-by-default and the highest
  stakes new code, where a weak test is genuinely dangerous; a sampled mutation run there buys
  confidence coverage cannot.

## Expected-delta log

Every intentional change to the type golden or the v3 test set is recorded here so review can
distinguish "intended breaking change" from "regression". Keep newest first.

| Date | Workstream | Golden/test delta | Reason |
| --- | --- | --- | --- |
| 2026-06-14 | foundation | baseline captured (85 symbols) | initial v3 snapshot, no delta yet |

## Status

- [x] Layer 2 golden captured from v3 and drift gate green (`@simple-git/v3-conformance`).
- [x] Sanctioned-removals manifest (`removals.json`).
- [ ] Layer 1 runtime oracle wired (lands with the jest→vitest runner workstream).
- [ ] Layer 3 `expectTypeOf` suites (lands with the typings/JS→TS workstream).
- [ ] Layer 4 `attw` + `publint` (lands with the tooling/`exports` workstream).
- [ ] Assertion-count + lint-ban enforcement in the ported suite.
