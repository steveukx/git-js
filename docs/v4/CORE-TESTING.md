# @simple-git/core — testing plan

Two complementary layers, kept in separate directories and runnable independently.

| Layer | Location | Runner | Asserts |
| --- | --- | --- | --- |
| **Unit** | `packages/core/test/unit/**` | vitest (`pnpm --filter @simple-git/core test:unit`) | The pure mapping from a task factory's **arguments → generated git command-line arguments** (and parsers mapping **sample output → response**). No child process. |
| **Integration** | `packages/core/test/integration/**` | vitest (`test:integration`) | The same tasks run through a real `GitExecutor` against a **real git repository in a temp directory**, asserting observable behaviour. |

`pnpm --filter @simple-git/core test` runs both.

## Unit tests — arguments and parsing

A task is an executor-agnostic descriptor, so the bulk of its contract is testable
without spawning git:

- **Command construction**: assert `task(...).commands`. For tasks that wrap a path in
  `pathspec`, the command entry is a *branded* value — assert both its rendered string
  (`commands.map(String)`) **and** `isPathSpec(commands[i])` so the protection is proven,
  not just the text.
- **Blessed config**: assert the `-c` pair is present **and** `isBlessedConfig(commands[i])`
  is true, so the guard-bypass is intentional and visible.
- **Parsers**: feed representative git output strings/buffers to the exported parser and
  assert the structured response (e.g. `parseCommitResult`, `parseVersion`).
- **Guards/plugins**: drive the plugin `action(...)` directly with crafted args/options and
  assert it permits or throws (`GitPluginError`) — including wildcard allow-list matching and
  the per-task bless exemption.

Each capability has at least one representative task under test:

| Capability | Task | Unit spec |
| --- | --- | --- |
| straight-through | `add` | `unit/add.spec.ts` |
| string response + custom parsing | `commit`, `version`, `init` | `unit/commit.spec.ts`, … |
| pathspec | `lsFiles` | `unit/ls-files.spec.ts` |
| binary response | `catFileBuffer` | `unit/cat-file.spec.ts` |
| blessed config | `commit` | `unit/commit.spec.ts` |

## Integration tests — real git in a temp dir

A small fixture (`test/integration/__fixtures__/repo.ts`) creates an isolated repository
under the OS temp dir, sets a local identity **out-of-band** (so the suite does not depend on
ambient `GIT_*`/global config), and returns a `GitExecutor` rooted there. Each test:

1. arranges files/commits via the executor (or raw git for setup),
2. runs the task under test through `run`/`raw`/`stream`,
3. asserts the parsed response and/or the repository's resulting state,
4. is fully isolated and removed on teardown.

Integration coverage for the representative tasks:

- **straight-through / parsing**: `add` then `commit` returns a real `CommitResult` whose
  `commit` hash matches `rev-parse HEAD`.
- **pathspec**: `lsFiles(['path'])` lists exactly the tracked path.
- **binary**: `catFileBuffer(['-p', '<blob>'])` returns the exact bytes written, proving no
  utf-8 round-trip corruption.
- **security model**: a guarded env var supplied via `.env(...)` rejects the task; an
  un-allow-listed config write rejects; the blessed internal `-c core.abbrev=40` in `commit`
  succeeds against the default (deny-by-default) allow-list.

## Conventions

- Unit specs never spawn a process; integration specs always use a throwaway temp repo.
- `expect.hasAssertions()` (or explicit counts) where a callback/async path could otherwise
  pass without asserting — guards against the silent no-op failure mode.
- No `.only` / `.skip` / `.todo` committed.
