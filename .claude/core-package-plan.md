# @simple-git/core — New Package Build Plan

> Status: **proposal / planning**. This is a from-scratch rewrite of the task-execution
> core, built as a new package (`@simple-git/core`) inside the existing `simple-git`
> monorepo. It is **not** a migration of the `simple-git` package and does not touch its
> code, tooling, or release process. Work happens locally on a branch/worktree as
> preferred — there is no stacked-PR process; phases are sequencing, not PR boundaries.

## 0. Decisions (locked)

| Area | Decision |
| --- | --- |
| Scope | New package `@simple-git/core` added to the existing Yarn workspace. The existing `simple-git` package, its Jest/Babel tooling, and its build/publish setup are **untouched**. |
| Package manager | Stay on **Yarn 4** workspaces for the whole repo. `@simple-git/core` is just another workspace member (`workspace:^` protocol for its internal deps, same as today). |
| Internal deps | Reuse `@simple-git/args-pathspec` and `@simple-git/argv-parser` from the existing workspace rather than re-implementing argv/pathspec handling. |
| Test runner | `@simple-git/core` uses **vitest**, independent of the root Jest config. No repo-wide test runner migration. |
| Build | esbuild, dual **ESM + CJS** output with a correct `exports` map (`import`/`require`/`types` conditions). No Babel in the new package. |
| Publishing | Not in scope yet. `@simple-git/core`'s `package.json` can stay unpublished/private until we're ready to ship; no `publishConfig`/release wiring needed for this plan. |
| `simple-git/promise` (`gitP`) | **Not implemented.** The new package has no promise-wrapper entry point at all. |
| Child-process env | **Deny-by-default filter.** The child still inherits the ambient environment (so `git` finds `PATH`/`HOME`), but every `GIT_`-prefixed or known-vulnerable `GitEnvKeys` variable is **stripped unless allow-listed** via `allowEnvironment` — applied to both inherited and `.env()`-supplied keys. The env is built **per task at spawn time**, so a blocked key fails *that task*, not the `.env()` call. |
| Git config writes | **Deny-by-default — nothing bypasses the allow-list.** Any attempt to *write* git config (via `-c`, `config set`, `--config-env`, or env) is blocked unless the key matches an `allowConfigWrite` allow-list (wildcards supported, e.g. `remote.*.url`). We ship spreadable **convenience preset constants** (e.g. `allowConfigWriteUser = ['user.name', 'user.email']`) — shortcuts, **not** a safety judgement and **not** an unconditional exemption. |
| Trailing callbacks | **Not implemented.** No `trailingFunctionArgument` / `SimpleGitTaskCallback` support. If the final arg to a task is a function, the package **throws** a helpful upgrade-style error rather than silently ignoring it. |
| `typings` | Types live next to implementation from day one — there is no separate `typings/` barrel to keep clean, because we're not inheriting v3's `.d.ts` files. |
| Task API | Tasks are **executor-agnostic descriptors** from the start. Core surface is `git.run()`, `git.raw()`, `git.stream()`. Familiar shorthand methods (`git.add()` etc.) are thin generated wrappers over the same descriptors. |
| Types location | Each task's response/option types live **next to the task** (`tasks/add.ts` exports both `add()` and its types). |
| Docs site | Out of scope for this plan. |
| Plugins | v3's plugin-driven behaviours (abort, progress reporting, timeout, unsafe-operation blocking, config-flag prefixing, pathspec suffixing, completion/error detection) are all **preserved**, functionality and public configuration surface unchanged. Internal wiring (the plugin/hook mechanism itself) may be reimplemented, as long as the same options produce the same runtime behaviour (§2.8). |
| Rollout | Local development in the monorepo; no pull requests, no stacked branches, no merge process. Phases below are for sequencing the work, not for structuring reviews. |

---

## 0.1 Backward-compatibility gate (non-negotiable)

**The existing `simple-git` v3 test suite is the acceptance test for `@simple-git/core`.**
We port the v3 suite to run against the new package's public surface, adapted to vitest,
and it must pass — proving the new implementation behaves like v3 wherever v3 behaviour is
being preserved.

The **only** permitted exceptions are tests that assert an interface we are intentionally
not building:

1. Tests covering the `gitP` wrapper / `require('simple-git/promise')` (not implemented).
2. Tests covering **trailing callback function** arguments on tasks (not implemented).

Rules for those exceptions (same carve-outs as the original migration plan):

- A test may only be dropped/rewritten if it *exclusively* exercises one of the two
  removed features above. If a test asserts both a removed and a retained behaviour, the
  retained assertions must be kept (split the test rather than drop it).
- Each dropped/rewritten test is replaced where applicable by a test asserting the **new
  guard behaviour** — e.g. passing a trailing function now *throws* the upgrade error
  (§2.6), and there is no `require('@simple-git/core/promise')` to test. These guard
  tests are additions, not substitutes for coverage.
- No reduction in coverage percentage versus the ported v3 baseline is acceptable beyond
  the lines made unreachable by the two exclusions; the 80% gate stays in force.
- We do not accumulate a backlog of skipped/`.todo` tests to fix "later" — each phase
  below keeps the ported suite green before moving on.
- Everything else in §4 below (deny-by-default env/config, in particular) is a genuine
  *behavioural* difference from v3, not just a tooling change — v3 tests that assert the
  old "pass everything through" env/config behaviour are expected to need updating to
  opt in via `allowEnvironment`/`allowConfigWrite`. That's a normal part of porting the
  suite, not a gate exception.

---

## 1. Reference: what v3 does today

This section is **not** something we're changing in place — `simple-git` stays as-is.
It's the behavioural reference `@simple-git/core` needs to reproduce (except where §4
lists an intentional difference), and the map of where v3's logic currently lives, since
that's what the ported test suite will be exercising indirectly.

**Execution core (`simple-git/src`):**
- `index.js` → `esModuleFactory(gitExportFactory(gitInstanceFactory))`, also exports `gitP`.
- `git.js` — the `Git` constructor; `Git.prototype = Object.create(SimpleGitApi.prototype)`.
  Holds a private `this._executor = new GitExecutor(...)`. ~40 prototype methods call
  `this._runTask(taskObject, trailingFunctionArgument(arguments))`.
- `lib/simple-git-api.ts` — `SimpleGitApi` class: `_runTask` plus ~10 inline methods, then
  ~10 more mixed in via `Object.assign(SimpleGitApi.prototype, checkout(), clone(), ...)`.
  This split (inline vs. default-export factories vs. named `*Task` functions) is the
  fragmentation `@simple-git/core` is designed to avoid from the outset.
- `lib/runners/` — `git-executor.ts`, `git-executor-chain.ts`, `scheduler.ts`,
  `tasks-pending-queue.ts`, `promise-wrapped.ts` (the `gitP` impl — has no equivalent in
  the new package).
- `lib/tasks/*` — 31 task files in **three inconsistent shapes**:
   - **(A)** default-export factory returning `{ method(){…} }` (`show`, `log`, `clone`,
     `commit`, `config`, `checkout`, `grep`, `version`, `count-objects`, `first-commit`),
   - **(B)** named `*Task()` builders (`branchTask`, `fetchTask`, `pushTask`, `remoteTask`,
     `tagListTask`, …),
   - **(C)** inline-only (methods defined directly in `git.js` using
     `straightThroughStringTask` / `straightThroughBufferTask`, e.g. `rm`, `diff`, `revparse`,
     `clean`, `catFile`).

**Dual return:** `_runTask` returns `Object.create(this, { then, catch, _executor })` — both
chainable (inherits the api prototype) and thenable. `@simple-git/core` keeps the
chainable sugar (§2.5) but the primary documented pattern is `git.run(...)`.

**Buffer vs utf-8:** `straightThroughBufferTask` (`format:'buffer'`) vs
`straightThroughStringTask` (`format:'utf-8'`); `GitExecutorChain` branches on
`isBufferTask(task)` and `GitOutputStreams.asStrings()` does the utf-8 conversion. In
`@simple-git/core` this becomes the descriptor's `format` field (§2.1) instead of two
parallel executor code paths.

**v3 tests (source of the ported suite):** Jest, `babel-jest`, coverage gate 80%. Unit
tests in `test/unit/**/*.spec.ts` rely on `test/unit/__mocks__/mock-child-process.ts`,
which calls `jest.mock('child_process', …)` and uses `jest.fn()` extensively; `afterEach`
resets the module singleton. Fixtures in `test/unit/__fixtures__/` plus the
`@simple-git/test-utils` package. Integration tests spawn real git in temp dirs. All of
this gets ported to vitest for `@simple-git/core` (§3, Phase 3) — `vi.fn()` in place of
`jest.fn()`, `vi.mock()` with `vi.hoisted()` for the singleton pattern, `Mock` type from
`vitest`.

---

## 2. Target architecture (the task system)

### 2.1 The task descriptor

A task is a plain, executor-agnostic data object:

```ts
// src/tasks/task.ts
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
src/tasks/add.ts
  export interface AddOptions { … }
  export type AddResult = string;
  export function add(files: string|string[], options?: AddOptions): GitTask<AddResult> { … }
```

The task function returns a descriptor. **Its response and option types live in the same
file** and are re-exported from the public barrel — there's no separate `simple-git.d.ts`-
style monolith to build in the first place.

Every v3 command gets a named task function in `@simple-git/core`, including the ones that
were only inline methods in v3 — `rm()`, `diff()`, `revParse()`, `clean()`, `catFile()`, …
— so every command is reusable and documentable the same way.

### 2.3 Executor surface (the bespoke part)

The executor holds the parts that are genuinely stateful / not "spawn one command":

```ts
class Git {
  // execution
  // Variadic tuple pins the LAST task as the inferred result type R; leading
  // tasks run for their side effects and their results are discarded (`unknown`,
  // never `any`). `run()` with no tasks is therefore a compile error.
  run<R>(...tasks: [...GitTask<unknown>[], GitTask<R>]): Promise<R>;

  // `raw` normalises every v3 call shape into one descriptor. v3 hand-wrote overloads
  // for "1 string + options" … up to "5 strings + options"; a single labelled variadic
  // tuple replaces all of them and lets the string prefix be zero-length, so
  // `git.raw({ '--version': null })` (options-only) is valid.
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

- `run(...tasks)` replaces v3's chainable `_runTask` semantics: tasks run in series, the
  promise resolves with the **last** task's parsed response.
- `raw(...)` normalises its input shapes — a single descriptor, a `string[]`, varargs
  strings, and an **optional trailing `Options` object** (v3's existing
  `getTrailingOptions` behaviour) — into one descriptor, and always resolves a string.
  The trailing-options form is what preserves compatibility with v3's
  `raw(...args, options)` callers; the string prefix may be empty, so an options-only
  call like `git.raw({ '-C': repoDir })` is supported.
- `stream(task)` resolves a promise of an async iterator over `Buffer` chunks from the child
  process; the descriptor's `format` decides utf-8 vs binary intent for consumers. This is
  new surface — v3 has no equivalent.

### 2.4 Method sugar (familiar API surface)

Every v3-shaped method exists as a one-liner so code written against v3's API keeps
working (minus the two intentionally-absent features — callbacks and `gitP`):

```ts
add(files, options?) { return this.run(add(files, options)); }
push(remote?, branch?, options?) { return this.run(push(remote, branch, options)); }
```

These wrappers are **generated/registered from a single binding table**, not hand-written
prototype soup, so the api file never becomes fragmented the way v3's did. The binding
table is also the natural input to a future docs generator (every entry = one command
available both as `git.x()` and as a standalone `x()` task for `run`/`raw`/`stream`).

### 2.5 Chainability decision

v3's `git.add().commit()` method-chaining (via `Object.create(this, …)`) is retained for
the sugar methods for familiarity, but the **promoted** pattern becomes
`git.run(add('.'), commit('msg'), push())`. (Open sub-question flagged in §6.)

### 2.6 Removed-feature guard (callbacks)

A shared helper used by every sugar method and by `run`/`raw`/`stream`:

```ts
function assertNoTrailingCallback(args: unknown[]) {
  if (typeof args[args.length - 1] === 'function') {
    throw new TaskConfigurationError(
      '@simple-git/core does not support trailing callback arguments. Use the returned ' +
      'promise instead.'
    );
  }
}
```

This keeps a loud, documented failure rather than silently ignoring callbacks — the same
intent as the original migration plan's guard, just present from day one instead of being
introduced partway through.

### 2.7 Deny-by-default environment & config

v3's model is **reactive**: `git.env` is `undefined` by default, Node's `spawn` therefore
inherits the full `process.env`, and `@simple-git/argv-parser` retro-actively scans
args/env for ~23 known vulnerability categories, throwing only when one is matched.
`@simple-git/core` inverts this to **deny-by-default** so that a dangerous variable or
config write fails closed rather than open.

Two mechanisms, both enforced in the spawn pipeline (not just at the public API, so
`git.raw` and direct task use are covered equally):

**(a) Environment filtered per task, deny-by-default.**
`@simple-git/core` still starts from the ambient environment (so `git` can still find
`PATH`/`HOME` and run out of the box) — it does **not** spawn with an empty `{}`. What
changes versus v3 is that every key which is `GIT_`-prefixed **or** in the curated
known-vulnerable `GitEnvKeys` set is **removed unless explicitly allowed** via
`allowEnvironment`. `GitEnvKeys` covers both the `GIT_*` family (e.g. `GIT_SSH_COMMAND`,
`GIT_PROXY_COMMAND`, `GIT_EDITOR`, `GIT_PAGER`, `GIT_EXTERNAL_DIFF`, `GIT_CONFIG*`,
`GIT_ASKPASS`, `GIT_TERMINAL_PROMPT`, …) **and the non-prefixed variables git still
honours** (e.g. `EDITOR`, `PAGER`) — so those are guarded too despite lacking the `GIT_`
prefix. This applies equally to inherited vars and to anything the caller adds through
`.env(...)`.

> **Timing — important.** The effective environment is **built at task-execution time**,
> not when `.env()` is called. `.env()` only records intent on the executor; the
> filtering and the deny decision happen as each task is spawned. Consequently a blocked
> key causes **the task to reject** (its returned promise / `run`/`raw`/`stream` call),
> *not* the `.env()` call. This matters because one configured `git` instance runs many
> tasks, and because the ambient env may differ between two tasks on the same instance.

```ts
const git = new SimpleGitCore({ allowEnvironment: ['GIT_EDITOR'] as const });

await git.env({ GIT_EDITOR: '' }).raw('status');       // ok — GIT_EDITOR allow-listed
await git.env({ PATH: '/usr/bin' }).raw('status');      // ok — PATH is not a GitEnvKey
await git.env({ EDITOR: '' }).raw('status');            // the raw() task rejects — EDITOR is a GitEnvKey, not allowed
await git.env({ GIT_SSH_COMMAND: '…' }).raw('status');  // the raw() task rejects — not allowed
```

(Non-`GIT_`/non-`GitEnvKeys` variables such as `PATH`, `HOME` are retained — they are not a
git-level injection vector on their own, though they remain subject to the existing
argv-parser vulnerability checks. Note `EDITOR` *is* in `GitEnvKeys` — git honours it as a
fallback editor — so it is stripped unless allow-listed.)

**(b) Config-write allow-list (`allowConfigWrite`).**
All git config *writes* are blocked unless the key matches an allow-list entry. This covers
every write surface: the `config` array option (`-c k=v`), `git config set …` / `git config
k v`, and `--config-env`. Matching supports `*` wildcards on a dot-segment basis:

```ts
const git = new SimpleGitCore({ allowConfigWrite: ['user.name', 'remote.*.url'] as const });

git.raw('config', 'set', 'user.name', 'Steve');          // ok
git.raw('config', 'set', 'remote.origin.url', '…');      // ok — matches remote.*.url
git.raw('config', 'set', 'user.email', 's@e.com');       // task rejects — not allow-listed
git.raw('-c', 'core.pager=cat', 'log');                  // task rejects — write via -c
```

**Nothing bypasses `allowConfigWrite`** — there is no unconditionally-writable key, so the
enforcement path stays single and can never fail open. What we ship instead is a set of
**convenience preset constants**: plain, spreadable `readonly string[]`s that save the caller
from retyping common keys. They are explicitly framed as *shortcuts, not a declaration that
the keys are safe*. The first is:

```ts
export const allowConfigWriteUser = ['user.name', 'user.email'] as const;

// one-line opt-in for the common "make a commit" case, still no hidden exemption:
const git = new SimpleGitCore({ allowConfigWrite: [...allowConfigWriteUser, 'remote.*.url'] });
```

Further presets can be added later if real friction emerges (each as its own named constant
so consumers opt in deliberately). Reads (`config get`, `config list`, `-c` of a known-safe
read) are unaffected.

**Wiring.** Implemented as plugins registered when constructing the executor, consuming two
`SimpleGitCoreOptions` fields (`allowEnvironment`, `allowConfigWrite`). The env filter builds
the final `env` object **at spawn time** from `{ ...ambient, ...executor.env }` and then
strips disallowed keys — it runs at the `spawn.options` hook (which fires per task). The
config-write guard runs at `spawn.args` and must see the final argv, including any injected
`-c` flags from command-prefixing logic, so it is registered to run **after** that plugin.
Violations throw a plugin error with `'unsafe'`-family messaging that names the offending
key and the option needed to permit it. This composes with — does not replace — the
existing argv-parser vulnerability checks: deny-by-default is the outer gate, the
argv-parser checks remain the inner defence for allowed-but-still-dangerous values. Reuses
`@simple-git/argv-parser`'s existing key-parsing logic rather than re-implementing it.

Because filtering is per-task and fails the task (not `.env()`), the loud, key-naming error
surfaces exactly where the offending command runs — never silently stripped.

### 2.8 Existing plugin-driven behaviour (abort, progress, timeout, etc.)

v3's other runtime behaviours — beyond the task descriptors themselves — are implemented
as plugins that hook into the executor around the child-process spawn, rather than as
methods on `Git`. `@simple-git/core` keeps all of this **functionality and its public
configuration surface**; what's allowed to change is the internal hook mechanism itself.

**Behaviours carried over (as best captured from the v3 source — flag any I've missed or
mis-described so this list can be corrected before Phase 2):**

| Behaviour | v3 config surface | What it does |
| --- | --- | --- |
| Abort | `abort: AbortSignal` on `SimpleGitOptions` / per-task | Kills the in-flight child process when the signal fires; the task's promise rejects with an abort error instead of hanging or resolving. |
| Progress reporting | `progress: (event) => void` on `SimpleGitOptions` | Parses selected commands' stderr (e.g. `clone`, `push`, `pull`, `fetch`) for git's own `Counting objects: 33% …` style progress output and calls back with a structured `{ method, stage, progress, processed, total }`-shaped event. |
| Timeout | `timeout: { block: ms }` on `SimpleGitOptions` / per-task | Kills the child process if it produces no output for `block` ms; the task rejects with a timeout error. |
| Unsafe-operation blocking | `unsafe.allowUnsafeCustomBinary`, plus the existing argv-parser vulnerability categories | Refuses to spawn commands that look like known injection/vulnerability patterns unless explicitly allowed. This is the "inner defence" that composes with the new deny-by-default env/config guards in §2.7 — deny-by-default is the outer gate, this stays as the inner one. |
| Config-flag prefixing | `config: string[]` constructor option | Turns construction-time config strings into `-c key=value` flags prefixed onto every command. Under `@simple-git/core`, these are **also** subject to the `allowConfigWrite` guard from §2.7(b) — a `config` entry that isn't allow-listed now fails the same way a runtime `-c` would, rather than being implicitly trusted just because it was set at construction time. |
| Pathspec suffixing | (automatic, not user-configured) | Inserts a `--` separator before pathspec-like trailing arguments so an argument that looks like a flag (or a ref that could be confused with a path) isn't misinterpreted by git. |
| Completion / error detection | (automatic) | Decides whether a finished process counts as success or failure — beyond a bare exit code — and shapes the error object/message a task rejects with. |

**What's allowed to change:** the mechanism plugins use to attach to the spawn lifecycle
(the equivalent of v3's `plugin-store.ts` event names like `spawn.args` / `spawn.options` /
`spawn.after` / `exit` / `error`) can be redesigned to fit the new `GitTask`/executor
model — for example, as a smaller ordered pipeline of hooks around "build args", "build
spawn options", "on child-process created", "on exit" rather than a generic event emitter.
The two new deny-by-default guards from §2.7 are simply two more entries in that same
pipeline, which is why their §2.7 write-up already talks about ordering relative to
config-flag prefixing.

**What must not change:** the option names and shapes above (`abort`, `progress`,
`timeout`, `config`, `unsafe.allowUnsafeCustomBinary`), and the observable behaviour each
one produces — same abort semantics, same progress event shape, same timeout trigger
condition, same classes of blocked "unsafe" commands, same pathspec-safety insertion,
same success/failure classification. Existing consumer code that configures these options
should work against `@simple-git/core` unchanged.

---

## 3. Phases

Sequencing for local development inside the monorepo. No branches to stack, no PRs — each
phase should just leave `@simple-git/core` in a working, tested state before moving to the
next.

### Phase 1 — Package scaffolding
- Add `packages/core` (name: `@simple-git/core`) to the existing Yarn workspace.
- `package.json`: `workspace:^` deps on `@simple-git/args-pathspec` and
  `@simple-git/argv-parser`; mark unpublished/private for now.
- esbuild config for dual ESM+CJS output with a correct `exports` map
  (`import`/`require`/`types` conditions).
- Add `vitest` + `vitest.config.ts` for this package only (`globals: true`,
  `environment: 'node'`, `@vitest/coverage-v8`, 80% gate) — no changes to the root Jest
  config or the existing `simple-git` package's test setup.
- **Acceptance:** `yarn workspace @simple-git/core build` and
  `yarn workspace @simple-git/core test` run (empty/smoke test is fine at this point);
  existing `simple-git` package build/test is unaffected.

### Phase 2 — Task descriptor system + executor core
- Land the `GitTask<R>` descriptor type (§2.1) and the executor's `run`/`raw`/`stream`
  (§2.3), plus the binding-table mechanism and the §2.6 trailing-callback guard.
- Design the hook pipeline that replaces v3's `plugin-store.ts` (§2.8) and port each
  existing plugin's functionality onto it: abort, progress reporting, timeout,
  unsafe-operation blocking, config-flag prefixing, pathspec suffixing, and
  completion/error detection.
- Implement the environment-filter and config-write-guard plugins (§2.7) on that same
  pipeline, with `allowEnvironment` / `allowConfigWrite` on `SimpleGitCoreOptions` and the
  `allowConfigWriteUser` preset. Confirm plugin ordering — config-write guard after
  config-flag prefixing (§2.7(b)) — with an explicit ordering test.
- Write one task per v3 command (§2.2), covering all three of v3's original shapes —
  factory-style, `*Task()`-style, and inline-only — as consistent `taskName()` descriptor
  functions with co-located types.
- Register the sugar methods (§2.4) from the binding table; keep chainability (§2.5).
- **Acceptance:** all call styles work end-to-end against a real git repo in a temp dir —
  `git.run(add('.'), commit('m'), push())`, `git.raw('add','.')`,
  `git.raw(['add','.'])`, `git.raw(add('.'))`, `git.stream(showBuffer(...))`, and
  `git.add('.')`-style sugar. Separately: an in-flight task can be aborted via `abort`, a
  `clone`/`push` reports progress events, a stalled process is killed by `timeout`, a
  known-unsafe command is blocked unless `unsafe.allowUnsafeCustomBinary` is set, and a
  construction-time `config` entry is subject to `allowConfigWrite` the same as a runtime
  `-c`.

### Phase 3 — Port the v3 test suite
- Copy `test/unit/**/*.spec.ts` and the integration tests into `@simple-git/core`,
  converting `jest.fn()` → `vi.fn()`, `jest.mock('child_process', …)` →
  `vi.mock('child_process', …)` with `vi.hoisted()` for the singleton mock pattern, and
  `jest.Mock` → `Mock` from `vitest`. This includes the existing plugin-behaviour specs
  (abort, progress, timeout, unsafe-operation blocking, config prefixing, pathspec
  suffixing, completion/error detection) — same assertions, new hook mechanism underneath.
- Point every spec at `@simple-git/core`'s public surface instead of v3's.
- Apply the §0.1 carve-outs: drop/replace only the tests that exclusively cover `gitP` or
  trailing callbacks, replacing them with guard-behaviour assertions (§2.6). Split any
  test that mixes a removed assertion with a retained one.
- Update any spec that relied on v3's old "pass everything through" env/config behaviour
  to opt in via `allowEnvironment`/`allowConfigWrite` — this is expected per §2.7, not a
  gate exception.
- **Acceptance (§0.1):** ported suite green under vitest, coverage ≥ 80%, with only the
  two sanctioned categories of test changes.

### Phase 4 — Typings pass
- Confirm every task's option/response types are genuinely co-located and re-exported
  from a single public barrel — no `simple-git.d.ts`-style monolith has crept in.
- Enforce with `isolatedDeclarations`/`verbatimModuleSyntax` and a lint rule so a `.d.ts`
  can never import a value (only relevant if we hand-author any `.d.ts` alongside the
  generated ones).

---

## 4. Known behavioural differences from v3 (reference for the ported suite)

1. No `gitP` / `require('simple-git/promise')` — use the package directly (already
   promise-based).
2. No trailing callback arguments — use the returned promise; passing a function throws.
3. Primary documented API is `git.run(...tasks)` / `git.raw` / `git.stream`; method sugar
   retained for familiarity.
4. Dual ESM+CJS with a tightened `exports` map — deep imports other than the documented
   entries aren't guaranteed the way v3's flatter layout allowed.
5. **`GIT_`-prefixed / known-vulnerable `GitEnvKeys` env vars are stripped by default** —
   from both the inherited environment and anything passed to `.env()` — unless
   allow-listed via `allowEnvironment`. Non-guarded vars (`PATH`, `HOME`, …) are
   unaffected. The env is assembled per task at spawn time, so a blocked key rejects
   *that task* (§2.7).
6. **Git config writes are blocked by default** (via `-c`, `config set`, `--config-env`)
   unless the key matches `allowConfigWrite` (wildcards supported). Nothing is
   unconditionally writable; spreadable convenience presets (e.g. `allowConfigWriteUser`)
   are exported as shortcuts only.

---

## 5. Risks & watch-items

- **vitest `vi.mock` hoisting** vs the singleton mock module — likely the most fiddly part
  of Phase 3; prototype it first with one spec before the full sweep.
- **Dual build correctness** — validate with `attw` + `publint` even though we're not
  publishing yet, so the `exports` map doesn't ship broken type/runtime resolution once we
  do.
- **Coverage gate** during Phase 2/3 — moving logic into per-task files can dip branch
  coverage; keep the gate and add tests per task as they're written.
- **Per-task env filtering (§2.7)** — the effective env is built at spawn time, so the
  failure point is the *task*, not `.env()`. Ported v3 tests that relied on a `GIT_*` key
  (e.g. `GIT_SSH_COMMAND` in integration setups) will need to opt in via
  `allowEnvironment`. Ambient `PATH`/`HOME` are retained, so git still runs out of the
  box — the blast radius is limited to guarded keys, not the whole environment.
- **Config-write plugin ordering** — the guard must run *after* any command-prefixing
  plugin to see injected `-c` flags; assert this ordering in a test so a future
  plugin-registration change can't silently open the gate.
- **Plugin functionality parity** — abort/progress/timeout/unsafe-blocking/pathspec-
  suffixing/completion-detection are being ported onto a new hook pipeline rather than
  v3's event-emitter-style plugin store; the risk is subtle behavioural drift (e.g.
  progress event shape, exact timeout trigger condition) rather than an outright missing
  feature. The ported v3 specs (Phase 3) are the main defence here — treat any of them
  failing as a parity bug, not a test that needs updating.
- **`stream()` semantics** — define backpressure/encoding contract clearly; it's new
  surface with no v3 precedent to fall back on.

## 6. Open sub-questions (non-blocking, resolve during Phase 2)

- Keep method-chaining (`git.add().commit()`) long-term, or de-emphasise it in favour of
  `run(...)`? (Plan currently: keep, de-emphasise in any future docs.)
- `git.stream()` return — `Promise<AsyncIterableIterator<Buffer>>` (as briefed) vs
  returning a Node `Readable`. Briefed shape assumed.
- Public entry name for standalone tasks: `@simple-git/core/tasks` (assumed) vs top-level
  exports.

