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
| Trailing callbacks | **Removed.** Delete `trailingFunctionArgument` / `SimpleGitTaskCallback` usage from the public API. Replace with a guard: if the final arg to a task is a function, **throw** a helpful upgrade error. (breaking) |
| `typings/` | `.d.ts` files must import/export **types only**, never implementations. Move runtime exports (error classes, enums, `pathspec`, `grepQueryBuilder`) into the source `index` surface, not the typings barrel. |
| Task API | Tasks become **executor-agnostic descriptors**. New `git.run()`, `git.raw()`, `git.stream()`. Existing `git.add()` etc. retained as thin wrappers. Executor-mutating methods (`cwd`, `env`, `outputHandler`, `customBinary`) stay **bespoke**. |
| Types location | Each task's response/option types live **next to the task** (`tasks/add.ts` exports both `add()` and its types). The 1,000-line `simple-git.d.ts` is dismantled. |
| Docs | New Astro + **Starlight** site (building on #1123, moved to `website/`). API reference **auto-generated from TSDoc** (TypeDoc → Starlight). |
| Rollout | One long-lived **`v4`** integration branch; each workstream lands as its own PR stacked onto it; merge to `main` when the whole set is green. |

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
  run<T>(...tasks: GitTask<any>[]): Promise<T>;   // chain in series, resolve last
  raw(task: GitTask<any>): Promise<string>;       // single task → full string
  raw(commands: string[]): Promise<string>;
  raw(...commands: string[]): Promise<string>;
  stream(task: GitTask<any>): Promise<AsyncIterableIterator<Buffer>>; // single task, raw chunks

  // bespoke, executor-mutating — NOT descriptors
  cwd(dir): this;
  env(name, value): this;
  outputHandler(fn): this;
  customBinary(cmd): this;
}
```

- `run(...tasks)` replaces the old chainable `_runTask` semantics: tasks run in series, the
  promise resolves with the **last** task's parsed response.
- `raw(...)` normalises three input shapes (single descriptor, `string[]`, varargs strings)
  to a single descriptor and always resolves a string.
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
- Remove `gitP` from all tests and typings.
- Add migration note to `docs/UPGRADE-V3-TO-V4.md`.
- **Acceptance:** no references to `gitP` / `simple-git/promise` remain; build + tests green.

### PR 5 — Remove trailing-callback support (breaking)
- Delete `trailingFunctionArgument` and `SimpleGitTaskCallback` from the public path and
  `task-callback.ts` wiring; keep internal promise plumbing.
- Add `assertNoTrailingCallback` guard (§2.6) into every entry point.
- Update/replace the callback-style tests with assertions that the guard throws the documented
  error.
- Document in `UPGRADE-V3-TO-V4.md`.

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
- **`stream()` semantics** — define backpressure/encoding contract clearly; it's new surface.

## 6. Open sub-questions (non-blocking, resolve during PR 6)

- Keep method-chaining (`git.add().commit()`) long-term, or deprecate it in favour of
  `run(...)`? (Plan currently: keep, de-emphasise in docs.)
- `git.stream()` return — `Promise<AsyncIterableIterator<Buffer>>` (as briefed) vs returning a
  Node `Readable`. Briefed shape assumed.
- Public entry name for standalone tasks: `simple-git/tasks` (assumed) vs top-level exports.
