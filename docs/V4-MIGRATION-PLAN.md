# simple-git v4 — Migration & Architecture Plan

> Status: **proposal / planning**. This document is the agreed scope and sequencing for the
> next major (`v4`). It is the single source of truth for the breaking changes and the
> internal re-architecture. Each numbered workstream below maps to one stacked PR.

## 0. Decisions (locked)

| Area | Decision |
| --- | --- |
| Package manager | Replace Yarn 4 workspaces with **pnpm** workspaces. (There is **no lerna** in the repo today — orchestration is `yarn workspaces foreach` + changesets. Changesets stays.) |
| Internal deps | Use pnpm `workspace:^` protocol; publish via `pnpm publish` so `workspace:` ranges are rewritten to real versions automatically at pack time. |
| Test runner | Replace **jest + babel-jest** with **vitest**. |
| Build | Remove **all babel** (incl. `@simple-git/babel-config`). Keep esbuild. Continue shipping **dual ESM + CJS**. |
| Module format | **Dual ESM + CJS** with a correct `exports` map (`import`/`require`/`types` conditions). |
| `build:pkg` | Remove the `build:pkg` script + `devtools/package-json.ts` rewrite step entirely (pnpm publish handles version resolution; `publishConfig` handles path swaps). |
| `publish` block | Rename the top-level `publish` key to **`publishConfig`** in every package, merging into any existing `publishConfig`. |
| `simple-git/promise` | **Removed.** Delete `promise.js`, `gitP`, and the `./promise` export. (breaking) |
| Child-process env | **Deny-by-default filter.** The child still inherits the ambient env (so `git` finds `PATH`/`HOME`), but every `GIT_`-prefixed or known-vulnerable `GitEnvKeys` variable is **stripped unless allow-listed** via `allowEnvironment` — applied to both inherited and `.env()`-supplied keys. The env is built **per task at spawn time**, so a blocked key fails *that task*, not the `.env()` call. (breaking) |
| Git config writes | **Deny-by-default.** Any attempt to *write* git config (via `-c`, `config set`, `--config-env`, or env) is blocked unless the key matches an `allowConfigWrite` allow-list (wildcards supported, e.g. `remote.*.url`). A small **blessed** default set ships for convenience. (breaking) |
| Trailing callbacks | **Removed.** Delete `trailingFunctionArgument` / `SimpleGitTaskCallback` usage from the public API. Replace with a guard: if the final arg to a task is a function, **throw** a helpful upgrade error. (breaking) |
| `typings/` | `.d.ts` files must import/export **types only**, never implementations. Move runtime exports (error classes, enums, `pathspec`, `grepQueryBuilder`) into the source `index` surface, not the typings barrel. |
| Task API | Tasks become **executor-agnostic descriptors**. New `git.run()`, `git.raw()`, `git.stream()`. Existing `git.add()` etc. retained as thin wrappers. Executor-mutating methods (`cwd`, `env`, `outputHandler`, `customBinary`) stay **bespoke**. |
| Types location | Each task's response/option types live **next to the task** (`tasks/add.ts` exports both `add()` and its types). The 1,000-line `simple-git.d.ts` is dismantled. |
| Docs | New Astro + **Starlight** site (building on #1123, moved to `website/`). API reference **auto-generated from TSDoc** (TypeDoc → Starlight). |
| Rollout | One long-lived **`v4`** integration branch; each workstream lands as its own PR stacked onto it; merge to `main` when the whole set is green. |

---

## 0.1 End-state acceptance criterion (non-negotiable)

**Every test that exists today must still pass on the `v4` branch**, ported to the
new tooling (vitest) but otherwise asserting the same behaviour. This is a hard gate
on the final merge to `main` — the migration is *only* a tooling/architecture change,
not a behavioural one, so existing coverage is our proof that behaviour is preserved.

The **only** permitted exceptions are tests that assert an intentionally-removed
interface:

1. Tests covering the `gitP` wrapper / `require('simple-git/promise')` (removed — see PR 4).
2. Tests covering **trailing callback function** arguments on tasks (removed — see PR 5).

Rules for those exceptions:

- A test may only be deleted/rewritten if it *exclusively* exercises a removed feature.
  If a test asserts both removed and retained behaviour, the retained assertions must be
  kept (split the test rather than delete it).
- Each removed/rewritten test is replaced where applicable by a test asserting the **new
  guard behaviour** — e.g. passing a trailing function now *throws* the upgrade error
  (PR 5, §2.6), and `require('simple-git/promise')` is gone. These guard tests are
  additions, not substitutes for coverage.
- No reduction in coverage percentage versus `main` is acceptable beyond the lines made
  unreachable by the two removals; the 80% gate stays in force.
- Every PR in the stack keeps the (ported) suite green; we do not accumulate a backlog of
  skipped/`.todo` tests to fix "later".

---

## 1. Current-state reference (what we are changing)

**Monorepo:** Yarn 4.14.1 workspaces (`packages/*`, `simple-git`). Packages:
`args-pathspec`, `argv-parser`, `babel-config`, `test-utils`, and the consumer fixtures
`test-es-module-consumer`, `test-javascript-consumer`, `test-typescript-consumer`,
`test-typescript-esm-consumer`. Root `devtools/` holds build helpers (`package-json.ts`,
`vite-config.ts`, `reset-package-json.ts`, etc.).

**Execution core (`simple-git/src`):**
- `index.js` → `esModuleFactory(gitExportFactory(gitInstanceFactory))`, also exports `gitP`.
- `git.js` — the `Git` constructor; `Git.prototype = Object.create(SimpleGitApi.prototype)`.
  Holds a private `this._executor = new GitExecutor(...)`. ~40 prototype methods call
  `this._runTask(taskObject, trailingFunctionArgument(arguments))`.
- `lib/simple-git-api.ts` — `SimpleGitApi` class: `_runTask` plus ~10 inline methods, then
  ~10 more mixed in via `Object.assign(SimpleGitApi.prototype, checkout(), clone(), ...)`.
  This split (inline vs. default-export factories vs. named `*Task` functions) is the
  "fragmentation" we are removing.
- `lib/runners/` — `git-executor.ts`, `git-executor-chain.ts`, `scheduler.ts`,
  `tasks-pending-queue.ts`, `promise-wrapped.ts` (the `gitP` impl, to be deleted).
- `lib/tasks/*` — 31 task files in **three inconsistent shapes**:
  - **(A)** default-export factory returning `{ method(){…} }` (`show`, `log`, `clone`,
    `commit`, `config`, `checkout`, `grep`, `version`, `count-objects`, `first-commit`),
  - **(B)** named `*Task()` builders (`branchTask`, `fetchTask`, `pushTask`, `remoteTask`,
    `tagListTask`, …),
  - **(C)** inline-only (methods defined directly in `git.js` using
    `straightThroughStringTask` / `straightThroughBufferTask`, e.g. `rm`, `diff`, `revparse`,
    `clean`, `catFile`).

**Dual return:** `_runTask` returns `Object.create(this, { then, catch, _executor })` — both
chainable (inherits the api prototype) and thenable.

**Buffer vs utf-8:** `straightThroughBufferTask` (`format:'buffer'`) vs
`straightThroughStringTask` (`format:'utf-8'`); `GitExecutorChain` branches on
`isBufferTask(task)` and `GitOutputStreams.asStrings()` does the utf-8 conversion.

**typings/:** `index.d.ts`, `simple-git.d.ts` (~1,033 lines), `response.d.ts`, `types.d.ts`,
`errors.d.ts`. Problem children: `errors.d.ts` does `export *` from the **implementation**
`src/lib/errors/*.ts`, and `types.d.ts` re-exports **values** (`CleanOptions`, `ResetMode`,
`GitConfigScope`, `grepQueryBuilder`, …) alongside types.

**Tests:** jest, `babel-jest`, coverage gate 80%. Unit tests in
`test/unit/**/*.spec.ts` rely on `test/unit/__mocks__/mock-child-process.ts`, which calls
`jest.mock('child_process', …)` and uses `jest.fn()` extensively; `afterEach` resets the
module singleton. Fixtures in `test/unit/__fixtures__/` plus the `@simple-git/test-utils`
package. Integration tests spawn real git in temp dirs.

---

## 2. Target architecture (the task system)

### 2.1 The task descriptor

A task is a plain, executor-agnostic data object — already close to today's `SimpleGitTask`:

```ts
// lib/tasks/task.ts
export interface GitTask<R> {
  commands: string[];
  format: 'utf-8' | 'buffer' | 'empty';
  parser(stdOut: TIn, stdErr: TIn): R;   // TIn = string | Buffer per `format`
  onError?: TaskErrorHandler;
}
```

Crucially a descriptor carries **everything needed to run and interpret** the command,
including its choice of utf-8 vs buffer. `git.show(...)` and `git.showBuffer(...)` become two
descriptor factories (`show()` / `showBuffer()`), not two executor methods.

### 2.2 One file per task, types co-located

```
lib/tasks/add.ts
  export interface AddOptions { … }
  export type AddResult = string;
  export function add(files: string|string[], options?: AddOptions): GitTask<AddResult> { … }
```

The task function returns a descriptor. **Its response and option types live in the same
file** and are re-exported from the public barrel. This is what kills `simple-git.d.ts`.

For (C)-style inline commands we **create named task functions** (`rm()`, `diff()`,
`revParse()`, `clean()`, `catFile()`, …) so every command is reusable and documentable.

### 2.3 Executor surface (the bespoke part)

The executor keeps the parts that are genuinely stateful / not "spawn one command":

```ts
class Git {
  // execution
  // Variadic tuple pins the LAST task as the inferred result type R; leading
  // tasks run for their side effects and their results are discarded (`unknown`,
  // never `any`). `run()` with no tasks is therefore a compile error.
  run<R>(...tasks: [...GitTask<unknown>[], GitTask<R>]): Promise<R>;

  // `raw` keeps its full backward-compatible surface. The old API hand-wrote
  // overloads for "1 string + options" … up to "5 strings + options"; a single
  // labelled variadic tuple replaces all of them and lets the string prefix be
  // zero-length, so `git.raw({ '--version': null })` (options-only) is valid.
  raw(task: GitTask<unknown>): Promise<string>;            // descriptor form
  raw(commands: TaskOptions): Promise<string>;             // string[] OR Options object
  raw(...args: [...commands: string[], options: Options]): Promise<string>; // n strings + trailing options
  raw(...commands: string[]): Promise<string>;             // plain varargs strings
  stream(task: GitTask<unknown>): Promise<AsyncIterableIterator<Buffer>>; // single task, raw chunks

  // bespoke, executor-mutating — NOT descriptors
  cwd(dir): this;
  env(name, value): this;
  outputHandler(fn): this;
  customBinary(cmd): this;
}
```

- `run(...tasks)` replaces the old chainable `_runTask` semantics: tasks run in series, the
  promise resolves with the **last** task's parsed response.
- `raw(...)` normalises its input shapes — a single descriptor, a `string[]`, varargs
  strings, and an **optional trailing `Options` object** (the existing
  `getTrailingOptions` behaviour) — into one descriptor, and always resolves a string.
  The trailing-options form is what preserves backward compatibility with today's
  `raw(...args, options)` callers; the string prefix may be empty, so an options-only
  call like `git.raw({ '-C': repoDir })` is supported.
- `stream(task)` resolves a promise of an async iterator over `Buffer` chunks from the child
  process; the descriptor's `format` decides utf-8 vs binary intent for consumers.

### 2.4 Method sugar (upgrade path)

Every existing method is preserved as a one-liner so existing code keeps working (minus the
removed callback/`gitP`/`promise` features):

```ts
add(files, options?) { return this.run(add(files, options)); }
push(remote?, branch?, options?) { return this.run(push(remote, branch, options)); }
```

These wrappers are **generated/registered from a single binding table**, not hand-written
prototype soup, so the api file stops being fragmented. The binding table is also the input
to the docs generator (every entry = one documented command available both as `git.x()` and
as a standalone `x()` task for `run`/`raw`/`stream`).

### 2.5 Chainability decision

The current `git.add().commit()` method-chaining (via `Object.create(this, …)`) is retained
for the sugar methods for backward compatibility, but the **promoted** pattern in docs becomes
`git.run(add('.'), commit('msg'), push())`. (Open sub-question flagged in §6.)

### 2.6 Removed-feature guard (callbacks)

A shared helper used by every sugar method and by `run`/`raw`/`stream`:

```ts
function assertNoTrailingCallback(args: unknown[]) {
  if (typeof args[args.length - 1] === 'function') {
    throw new TaskConfigurationError(
      'simple-git v4 removed trailing callback arguments. Use the returned promise instead. ' +
      'See https://github.com/steveukx/git-js/blob/main/docs/UPGRADE-V3-TO-V4.md#callbacks'
    );
  }
}
```

This keeps a loud, documented failure rather than silently ignoring callbacks.

### 2.7 Deny-by-default environment & config (breaking security model)

Today the model is **reactive**: `git.env` is `undefined` by default, Node's `spawn`
therefore inherits the full `process.env`, and `@simple-git/argv-parser` retro-actively
scans args/env for ~23 known vulnerability categories, throwing only when one is matched.
v4 inverts this to **deny-by-default** so that a dangerous variable or config write fails
closed rather than open.

Two changes, both enforced in the spawn pipeline (not just at the public API, so `git.raw`
and direct task use are covered equally):

**(a) Environment filtered per task, deny-by-default.**
v4 still starts from the ambient environment (so `git` can still find `PATH`/`HOME` and run
out of the box) — it does **not** spawn with an empty `{}`. What changes is that every key
which is `GIT_`-prefixed **or** in the curated known-vulnerable `GitEnvKeys` set (e.g.
`GIT_SSH_COMMAND`, `GIT_PROXY_COMMAND`, `GIT_EDITOR`, `GIT_PAGER`, `GIT_EXTERNAL_DIFF`,
`GIT_CONFIG*`, `GIT_ASKPASS`, `GIT_TERMINAL_PROMPT`, …) is **removed unless explicitly
allowed** via `allowEnvironment`. This applies equally to inherited vars and to anything the
caller adds through `.env(...)`.

> **Timing — important.** The effective environment is **built at task-execution time**, not
> when `.env()` is called. `.env()` only records intent on the executor; the filtering and
> the deny decision happen as each task is spawned. Consequently a blocked key causes **the
> task to reject** (its returned promise / `run`/`raw`/`stream` call), *not* the `.env()`
> call. This matters because one configured `git` instance runs many tasks, and because the
> ambient env may differ between two tasks on the same instance.

```ts
const git = simpleGit({ allowEnvironment: ['GIT_EDITOR'] as const });

await git.env({ GIT_EDITOR: '' }).raw('status');       // ok — GIT_EDITOR allow-listed
await git.env({ EDITOR: '' }).raw('status');            // ok — EDITOR is not a GitEnvKey
await git.env({ GIT_SSH_COMMAND: '…' }).raw('status');  // the raw() task rejects — not allowed
```

(Non-`GIT_`/non-`GitEnvKeys` variables such as `EDITOR`, `PATH`, `HOME` are retained — they
are not a git-level injection vector on their own, though they remain subject to the existing
argv-parser vulnerability checks.)

**(b) Config-write allow-list (`allowConfigWrite`).**
All git config *writes* are blocked unless the key matches an allow-list entry. This covers
every write surface: the `config` array option (`-c k=v`), `git config set …` / `git config
k v`, and `--config-env`. Matching supports `*` wildcards on a dot-segment basis:

```ts
const git = simpleGit({ allowConfigWrite: ['user.name', 'remote.*.url'] as const });

git.raw('config', 'set', 'user.name', 'Steve');          // ok
git.raw('config', 'set', 'remote.origin.url', '…');      // ok — matches remote.*.url
git.raw('config', 'set', 'user.email', 's@e.com');       // task rejects — not allow-listed
git.raw('-c', 'core.pager=cat', 'log');                  // task rejects — write via -c
```

A **blessed** default set (exported as a named constant, e.g. `BLESSED_CONFIG_WRITE` —
`user.name`, `user.email`, `commit.gpgSign`, `init.defaultBranch`, …) is provided so the
common case is one spread:
`simpleGit({ allowConfigWrite: [...BLESSED_CONFIG_WRITE, 'remote.*.url'] })`. Reads
(`config get`, `config list`, `-c` of a known-safe read) are unaffected.

**Wiring.** Implemented as plugins registered in `gitInstanceFactory`, consuming two new
`SimpleGitOptions` fields (`allowEnvironment`, `allowConfigWrite`). The env filter builds the
final `env` object **at spawn time** from `{ ...ambient, ...executor.env }` and then strips
disallowed keys — it runs at the `spawn.options` hook (which fires per task). The config-write
guard runs at `spawn.args` and must see the final argv, including
`commandConfigPrefixingPlugin`'s injected `-c` flags, so it is registered to run **after**
that plugin. Violations throw `GitPluginError` with `'unsafe'`-family messaging that names the
offending key and the option needed to permit it, and links to the upgrade doc. This composes
with — does not replace — the existing `blockUnsafeOperationsPlugin`: deny-by-default is the
outer gate, the argv-parser checks remain the inner defence for allowed-but-still-dangerous
values. Types reuse the existing `@simple-git/argv-parser` key parsing where possible rather
than re-implementing it.

**Upgrade path** (documented in `UPGRADE-V3-TO-V4.md`):

```ts
// v3 passed all GIT_* / vulnerable env through to git. If you relied on a guarded
// key (e.g. GIT_SSH_COMMAND or GIT_EDITOR), allow just the ones you need:
const git = simpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] });

// Non-guarded vars (PATH, HOME, EDITOR, …) keep working with no change.
```

Because filtering is per-task and fails the task (not `.env()`), the loud, key-naming error
surfaces exactly where the offending command runs — never silently stripped.

---

## 3. Workstreams (stacked PRs onto `v4`)

Ordered so each PR is green on its own. Branch base: create `v4` off `main`; stack feature
branches onto it.

### PR 1 — Tooling: Yarn → pnpm, remove babel, build:pkg, publishConfig
- Add `pnpm-workspace.yaml` (`packages/*`, `simple-git`, `website`); delete `workspaces`
  field, `.yarnrc.yml`, `.yarn/`, `yarn.lock`. Add `packageManager: pnpm@<x>` + `.npmrc`.
- Convert root scripts from `yarn workspaces foreach -A run <x>` to
  `pnpm -r run <x>` (and `pnpm -r --filter` where ordering matters).
- Delete `packages/babel-config`, all `babel.config.js`, all `@babel/*` and `babel-jest`
  deps, and the `@simple-git/babel-config` workspace dep.
- Delete every `build:pkg` script, the `prepublishOnly: build:pkg` hooks,
  `devtools/package-json.ts`, `devtools/reset-package-json.ts`, and the
  `build:pkg:reset` root script.
- In each publishable package (`simple-git`, `args-pathspec`, `argv-parser`): rename the
  top-level `publish` block to `publishConfig`, merging into the existing `publishConfig`
  (`simple-git` currently has none at top level but `.yarnrc.yml` set publish access — move
  `access: public` into `publishConfig`). Keep `src` `main` for local dev, with
  `publishConfig` overriding `main`/`module`/`types`/`exports` to the `dist` paths.
- Switch internal deps to `workspace:^` (already the case) and confirm `pnpm publish`
  resolves them. Update `.github/workflows/changesets.yml` and `ci.yml` to use
  `pnpm/action-setup`, `pnpm install --frozen-lockfile`, `pnpm -r build`, and
  `pnpm changeset publish` (which calls `pnpm publish` under the hood).
- **Acceptance:** `pnpm install && pnpm -r build` works; `pnpm -r test` still runs (jest for
  now); a `pnpm pack` dry-run of `simple-git` shows correct resolved versions + dist paths.

### PR 2 — Test runner: jest → vitest
- Add `vitest` + config per package (`vitest.config.ts`), `globals: true`,
  `environment: 'node'`, coverage via `@vitest/coverage-v8` with the 80% gate.
- Rewrite `test/unit/__mocks__/mock-child-process.ts`: `jest.fn()`→`vi.fn()`,
  `jest.mock('child_process', …)`→`vi.mock('child_process', …)` (note: vitest hoists
  `vi.mock`; the factory-returns-singleton pattern needs the singleton defined via
  `vi.hoisted(() => …)`). `jest.Mock` type → `Mock` from `vitest`.
- Sweep all `*.spec.ts`: import `{ describe, it, expect, beforeEach, afterEach, vi }` (or rely
  on globals), reorder imports per biome. Replace `jest.*` call sites.
- `args-pathspec` / `argv-parser` already vitest — align their config to the shared base.
- **Acceptance gate (§0.1):** the entire existing suite must be ported and pass under
  vitest with no behavioural changes and no net coverage loss; only the `gitP` and
  trailing-callback tests may be removed (and only in PR 4 / PR 5 respectively).
- Update consumer test packages (`test-typescript-consumer`, `-esm-consumer`,
  `test-javascript-consumer`, `test-es-module-consumer`) off `babel-jest` onto vitest (or
  node:test for the pure-JS consumers) resolving against built `dist`.
- Remove `@types/jest`, `jest`, `ts-node` where now unused; drop the root `resolutions.jest`.
- **Acceptance:** `pnpm -r test` green with coverage ≥ 80%; win32 spec filter preserved
  (`vitest run -t` / name filter equivalent of `test:win`).

### PR 3 — Typings hygiene (types-only `.d.ts`)
- `errors.d.ts`: stop `export *` from implementations. Error **classes** are runtime; expose
  them from the JS/TS source barrel (`index`), and have the typings only `export type` the
  class instance/shape where needed.
- `types.d.ts`: split type re-exports (`export type {…}`) from value re-exports; move the
  values (`CleanOptions`, `CleanMode`, `ResetMode`, `GitConfigScope`, `DiffNameStatus`,
  `CheckRepoActions`, `grepQueryBuilder`, `GitGrepQuery`, `pathspec`) to the source index.
- Enforce with `isolatedDeclarations`/`verbatimModuleSyntax` and a lint rule so a `.d.ts` can
  never import a value again.
- This PR is mostly mechanical and lands before the big rewrite so the rewrite starts from a
  clean type boundary.

### PR 4 — Remove `simple-git/promise` + `gitP` (breaking)
- Delete `simple-git/promise.js`, `lib/runners/promise-wrapped.ts`, the `./promise` entry in
  `exports`, the `promise.*` entry in `files`, and `gitP` from `index.js` /
  `gitExportFactory`.
- Remove `gitP` from all tests and typings. This is one of the **two §0.1-sanctioned
  test removals** — only tests that *exclusively* cover `gitP` / `simple-git/promise`
  may go; any retained assertions in a shared test must be preserved.
- Add migration note to `docs/UPGRADE-V3-TO-V4.md`.
- **Acceptance:** no references to `gitP` / `simple-git/promise` remain; the rest of the
  ported suite (per §0.1) stays green.

### PR 5 — Remove trailing-callback support (breaking)
- Delete `trailingFunctionArgument` and `SimpleGitTaskCallback` from the public path and
  `task-callback.ts` wiring; keep internal promise plumbing.
- Add `assertNoTrailingCallback` guard (§2.6) into every entry point.
- Update/replace the callback-style tests with assertions that the guard throws the documented
  error. This is the **second §0.1-sanctioned test change** — replace only the
  trailing-callback assertions; every other assertion in those specs must still pass.
- Document in `UPGRADE-V3-TO-V4.md`.

### PR 5b — Deny-by-default environment & config writes (breaking) — see §2.7
- Add `allowEnvironment?: readonly string[]` and `allowConfigWrite?: readonly string[]` to
  `SimpleGitOptions`; export `GitEnvKeys` and `BLESSED_CONFIG_WRITE` constants publicly.
- New `environmentFilterPlugin` (`spawn.options`, fires per task): **builds** the effective
  env at spawn time from `{ ...ambient, ...executor.env }`, then strips every `GIT_`-prefixed
  / `GitEnvKeys` key not in `allowEnvironment`. A disallowed key throws here → the *task*
  rejects (not `.env()`). The error names the key + the `allowEnvironment` option. Ambient
  inheritance is retained, so no empty-env change to `git-executor` defaults is needed.
- New `configWriteGuardPlugin` (`spawn.args`, registered to run **after**
  `commandConfigPrefixingPlugin`): detects config writes via `-c`, `config set`/`config k v`,
  `--config-env`; wildcard-matches against `allowConfigWrite`; throws otherwise. Reuse
  argv-parser config-key parsing rather than re-implementing.
- Tests: this is an interface change, so per §0.1 the affected existing tests are updated for
  the new default (any spec that relied on a `GIT_*`/vulnerable key flowing through now sets
  `allowEnvironment`). Add new specs: env filtering happens at task time and the *task*
  rejects (assert `.env()` itself does not throw); allow-list matching incl. wildcard
  `remote.*.url`; the blessed set; and the named error messages.
- Document the new security model + the §2.7 upgrade path in `UPGRADE-V3-TO-V4.md`.

### PR 6 — Task descriptor refactor (the big one)
Can be split into sub-PRs by task group to keep diffs reviewable:
1. Land `GitTask<R>` descriptor type + `run`/`raw`/`stream` on the executor, with the
   binding-table mechanism and the §2.6 guard. Keep old methods working via the table.
2. Normalise group (A) factories → plain `taskName()` descriptor functions, types co-located.
3. Normalise group (B) `*Task` builders → consistent `taskName()` naming + co-located types.
4. Create named task functions for group (C) inline commands.
5. Delete `simple-git-api.ts` fragmentation; the api becomes the binding table + the four
   bespoke methods. Dismantle `simple-git.d.ts` into per-task types; `typings/index` becomes a
   thin barrel re-exporting from source.
- **Acceptance:** all three call styles work —
  `git.run(add('.'), commit('m'), push())`, `git.raw('add','.')`, `git.raw(['add','.'])`,
  `git.raw(add('.'))`, `git.stream(showBuffer(...))`, and legacy `git.add('.')`. New public
  entry `simple-git/tasks` exports every task function.

### PR 7 — Docs site (build on #1123)
- Bring #1123's Starlight scaffold into `website/` as a pnpm workspace; wire `pnpm -r build`.
- Add TypeDoc + a Starlight TypeDoc integration to auto-generate the API reference from the
  co-located TSDoc on each task function/type. The binding table feeds a "available as
  `git.x()` and as `x()`" note into each symbol's page.
- Hand-write guides: getting started, the `run`/`raw`/`stream` model, and
  `UPGRADE-V3-TO-V4.md`.
- Deploy workflow (GitHub Pages/Cloudflare) — TBD with maintainer.

### PR 8 — Release prep
- Add a `major` changeset for `simple-git` (and any other bumped packages).
- Final pass on README, `exports` map validation (`@arethetypeswrong/cli`), publint.
- Merge `v4` → `main`; changesets action publishes via `pnpm publish`.

---

## 4. Breaking-changes summary (for UPGRADE doc + changeset)

1. `require('simple-git/promise')` / `gitP` removed → use `simpleGit()` (already promise-based).
2. Trailing callback arguments removed → use the returned promise; passing a function now throws.
3. (Behavioural) recommended API is `git.run(...tasks)` / `git.raw` / `git.stream`; method
   sugar retained.
4. Node / module: dual ESM+CJS retained, but `exports` map tightened — deep imports other than
   the documented entries (`.`, `./tasks`) are no longer guaranteed.
5. Babel removed (consumer-invisible, but anyone depending on `@simple-git/babel-config` is
   affected — it was private).
6. **`GIT_`-prefixed / known-vulnerable `GitEnvKeys` env vars are stripped by default** —
   from both the inherited environment and anything passed to `.env()` — unless allow-listed
   via `allowEnvironment`. Non-guarded vars (`PATH`, `HOME`, `EDITOR`, …) are unaffected. The
   env is assembled per task at spawn time, so a blocked key rejects *that task* (§2.7).
8. **Git config writes are blocked by default** (via `-c`, `config set`, `--config-env`)
   unless the key matches `allowConfigWrite` (wildcards supported); a blessed default set is
   exported.

---

## 5. Risks & watch-items

- **vitest `vi.mock` hoisting** vs the singleton mock module — the single most fiddly part of
  PR 2; prototype it first with one spec before the full sweep.
- **Dual build correctness** — validate with `attw` + `publint` so the `exports`/`publishConfig`
  rewrite doesn't ship broken type/runtime resolution.
- **`pnpm publish` + `workspace:` rewrite** — verify on a dry-run `pnpm pack` that
  `@simple-git/args-pathspec`/`argv-parser` ranges become real versions in the tarball; this
  is the behaviour that lets us delete `devtools/package-json.ts`.
- **Coverage gate** during the task refactor — moving code between files can dip branch
  coverage; keep the gate and add tests per task as they're converted.
- **Per-task env filtering (§2.7)** — the effective env is built at spawn time, so the failure
  point is the *task*, not `.env()`. Tests and consumers that previously relied on a `GIT_*`
  key (e.g. `GIT_SSH_COMMAND` in integration setups) will now have it stripped; they must
  opt in via `allowEnvironment`. Ambient `PATH`/`HOME` are retained, so git still runs out of
  the box — the blast radius is limited to guarded keys, not the whole environment.
- **Config-write plugin ordering** — the guard must run *after* `commandConfigPrefixingPlugin`
  to see injected `-c` flags; assert this ordering in a test so a future plugin-registration
  change can't silently open the gate.
- **`stream()` semantics** — define backpressure/encoding contract clearly; it's new surface.

## 6. Open sub-questions (non-blocking, resolve during PR 6)

- Keep method-chaining (`git.add().commit()`) long-term, or deprecate it in favour of
  `run(...)`? (Plan currently: keep, de-emphasise in docs.)
- `git.stream()` return — `Promise<AsyncIterableIterator<Buffer>>` (as briefed) vs returning a
  Node `Readable`. Briefed shape assumed.
- Public entry name for standalone tasks: `simple-git/tasks` (assumed) vs top-level exports.
