# simple-git release 4.x

Major release 4.x is a ground-up rewrite of the task execution core. The API you know is still
here — `git.add('.')`, `git.commit('message')`, `git.push()` all work the way they always have —
but underneath, every command is now a plain, inspectable data object, and every safety decision
fails closed instead of open.

Three things drove the rewrite:

- **Flexibility** — tasks are values you can build, pass around, and compose, rather than methods
  bolted onto one object.
- **Security** — environment variables and git config writes are deny-by-default. Nothing leaks
  into the child process, and nothing rewrites your git config, unless you said it could.
- **Memory** — `stream()` hands you an async iterable of chunks, so large output never has to be
  buffered in full just to be read.

For a per-release overview of changes, see the
[changelog](https://github.com/steveukx/git-js/blob/main/simple-git/CHANGELOG.md).

---

## What's new

### Tasks are data

Every command is a descriptor — a plain object carrying its arguments, its output format, and its
parser. Every one of them is exported by name, so you can build a task in one place and run it in
another:

```ts
import { simpleGit, add, commit, push } from 'simple-git';

const git = simpleGit('/path/to/repo');

await git.run(add('.'), commit('a message'), push());

await git.raw(myCustomTask());
```

`run()` executes tasks in series on one chain and resolves with the **last** task's parsed
response. A failure anywhere in the chain rejects the promise and stops the tasks after it from
running. The types follow: the result type is inferred from the final task, and `run()` with no
tasks is a compile error.

The familiar methods are still there as thin wrappers around the tasks of the same name,
so `git.add('.')` and `run(add('.'))` are essentially the same code path. Method chaining
(`git.add('.').commit('msg')`) still works too.

### `stream()` — output without the buffering

New in v4, with no v3 equivalent. `stream()` runs one task and resolves an async iterator over the
raw `Buffer` chunks of stdout, so you can process a large blob, archive, or diff as it arrives
instead of holding all of it in memory:

```ts
import { simpleGit, showBuffer } from 'simple-git';

const git = simpleGit('/path/to/repo');

for await (const chunk of await git.stream(showBuffer('HEAD:large-file.bin'))) {
   // chunk is a Buffer, handed over as git produces it
   await writeTo(destination, chunk);
}
```

The contract is deliberately precise:

- The promise resolves as soon as the process is known to be running — its first chunk of output,
  or its completion for a command that writes nothing. A pipeline guard that prevents the spawn
  rejects the promise, and no iterator is produced at all.
- A process that spawns and *then* fails surfaces its error out of the iterator, after any chunks
  it did produce.
- Nothing is dropped if you don't start iterating immediately — chunks queue until pulled.
- `stderr` is not streamed; it's retained for error reporting exactly as for any other task.

### `raw()` accepts every shape

Supporting the same "strings plus options" combination as v3, v4 adds support for running a single task structure:

```ts
await git.raw('log', '--oneline');            // varargs
await git.raw(['log', '--oneline']);          // array
await git.raw('log', { '--oneline': null });  // strings + trailing options
await git.raw({ '--version': null });         // options only
await git.raw(add('.'));                      // a task descriptor
```

---

## Security: deny-by-default

v3 was *reactive*. `git.env` was undefined by default, so Node's `spawn` inherited the whole of
`process.env`, and the argv parser retroactively scanned for known vulnerability patterns —
throwing only on a match. Anything unrecognised got through.

v4 inverts this. Both guards run inside the spawn pipeline rather than at the public API, so
`git.raw()`, a bound method, and a hand-built task descriptor are all covered identically.

### Environment variables no longer leak through

Every `GIT_`-prefixed variable, plus the curated set of non-prefixed variables git honours anyway
(`EDITOR`, `PAGER`, …), is **stripped from the child process environment unless you allow-list it**.
This applies both to variables inherited from the ambient environment and to anything you pass to
`.env()`.

Non-guarded variables — `PATH`, `HOME` and friends — still pass through, so git runs out of the box.

```ts
const git = simpleGit(baseDir, { allowEnvironment: ['GIT_TERMINAL_PROMPT'] });

await git.env('GIT_TERMINAL_PROMPT', '0').raw('fetch');  // ok — allow-listed
await git.env('PATH', '/usr/bin').raw('status');         // ok — not a guarded key
await git.env('GIT_DIR', '../elsewhere').raw('status');  // rejects — guarded, not allowed
```

The two gates are layered, and some keys need both. `allowEnvironment` is the outer gate; keys that
are *also* argv-parser vulnerability categories (`GIT_SSH_COMMAND`, `GIT_EDITOR`, `GIT_PAGER`,
`GIT_ASKPASS`, …) must additionally clear the inner defence via the matching `unsafe` flag:

```ts
const git = simpleGit(baseDir, {
   allowEnvironment: ['GIT_SSH_COMMAND'],
   unsafe: { allowUnsafeSshCommand: true },
});

await git.env('GIT_SSH_COMMAND', 'ssh -i ./deploy-key').fetch();
```

With only `allowEnvironment` set, the task rejects naming `allowUnsafeSshCommand` — the error tells
you which of the two gates stopped it. For why both are needed, see
[Why three options and not one?](#why-three-options-and-not-one) below.

The effective environment is assembled **per task, at spawn time**, from `{ ...ambient, ...env() }`.
That timing matters:

- A blocked key rejects **the task it is used with**, not the `.env()` call — one configured
  instance runs many tasks, and the ambient environment can differ between them.
- A guarded key supplied explicitly through `.env()` produces a loud error naming the key and the
  option needed to permit it.
- A guarded key merely *inherited* from the ambient environment is stripped silently and logged to
  the `debug` output.

### Git config writes are blocked

Any attempt to write git config is blocked unless the key matches an `allowConfigWrite` pattern.
The guard runs at `beforeSpawn` against the truly final argv and the final child environment, so it
sees every write channel:

- `-c key=value` prefix flags — including ones injected by the `config` constructor option
- `git config` set / unset
- `--config-env`
- `GIT_CONFIG_*` environment variables

Patterns match on a dot-segment basis, where `*` matches exactly one segment:

```ts
const git = simpleGit(baseDir, { allowConfigWrite: ['user.name', 'remote.*.url'] });

await git.raw('config', 'set', 'user.name', 'John Dow');     // ok
await git.raw('config', 'set', 'remote.origin.url', '…');    // ok — matches remote.*.url
await git.raw('config', 'set', 'user.email', 's@e.com');     // rejects — not allow-listed
await git.raw('-c', 'core.autocrlf=input', 'log');           // rejects — write via -c
```

As with the environment, the gates are layered. Config keys that are also known vulnerability
categories — `core.pager`, `core.editor`, `credential.helper`, `diff.external`, `filter.*`,
`gpg.program`, `include.path`, `merge.driver`, `protocol.allow`, `submodule.update`, … — need the
matching `unsafe` flag in addition to the allow-list entry:

```ts
const git = simpleGit(baseDir, {
   allowConfigWrite: ['core.pager'],
   unsafe: { allowUnsafePager: true },
});
```

**Nothing bypasses the allow-list.** There is no unconditionally-writable key, so the enforcement
path stays single and can never fail open. What ships instead is a set of spreadable convenience
presets — shortcuts to save retyping common keys, explicitly *not* a declaration that those keys
are safe:

```ts
import { simpleGit, allowConfigWriteUser } from 'simple-git';

const git = simpleGit(baseDir, {
   allowConfigWrite: [...allowConfigWriteUser, 'remote.*.url'],
});
```

Config **reads** (`config get`, `config list`) are unaffected.

### Why three options and not one?

`allowEnvironment` and `allowConfigWrite` can look like narrower restatements of `unsafe` — if you
have already opted in to `GIT_SSH_COMMAND`, what is `allowUnsafeSshCommand` adding? The answer is
that the two kinds of option are keyed on different things and fail in opposite directions, so
neither is a superset of the other.

**`allowEnvironment` and `allowConfigWrite` are keyed on a name.** They cover the entire environment
and config keyspace, know nothing about what any particular key does, and deny by default — so they
**fail closed**. Their question is *"what is my program allowed to touch?"*

**`unsafe` is keyed on a capability.** It is a curated list of around twenty known-dangerous
behaviours, each one spanning every channel git offers for reaching it, and it permits anything not
on the list — so it **fails open**. Its question is *"which dangerous capabilities do I accept?"*

#### What `allowUnsafeSshCommand` adds

`allowEnvironment: ['GIT_SSH_COMMAND']` opens exactly one variable name. `allowUnsafeSshCommand`
covers the *capability* of telling git which ssh binary to run — which git exposes through three
separate routes:

- the `GIT_SSH_COMMAND` environment variable
- the `GIT_SSH` environment variable
- the `core.sshCommand` config key

So the two options intersect rather than overlap. Naming the variable does not accept the
capability, and accepting the capability does not open the variable:

| Configuration | `.env('GIT_SSH_COMMAND', …)` |
| --- | --- |
| neither | blocked — `not permitted without enabling allowUnsafeSshCommand` |
| `allowEnvironment` only | blocked — `not permitted without enabling allowUnsafeSshCommand` |
| `unsafe` only | blocked — `blocked by the environment guard` |
| both | runs |

And because the capability flag spans channels while the allow-list does not, opting in to the
environment variable leaves the *other two* routes to the same capability shut:

```ts
const git = simpleGit(baseDir, {
   allowEnvironment: ['GIT_SSH_COMMAND'],
   allowConfigWrite: ['core.sshCommand'],
});

await git.env('GIT_SSH', '/tmp/ssh').raw('status');
// blocked by the environment guard - a different variable name

await git.raw('-c', 'core.sshCommand=ssh -i ./key', 'status');
// not permitted without enabling allowUnsafeSshCommand - a different route
```

That is the practical value of the capability flag: you cannot accidentally grant a dangerous
behaviour by opening one channel and forgetting the others, and a reviewer reading your options sees
the capability spelled out by name rather than having to recognise it from a config key.

#### What each layer catches that the others cannot

**Only the allow-lists see the ambient environment.** `unsafe` inspects the arguments and the
variables you supplied through `.env()`; it is not given the inherited environment. If your CI
exports `GIT_SSH_COMMAND` into the process, `unsafe` never sees it — only `allowEnvironment` strips
it.

**Only `unsafe` judges values.** Allow-listing `remote.*.url` is entirely reasonable, but a URL of
`ext::sh -c …` is remote code execution. The key was legitimately allowed, so the allow-list has
nothing to say; `allowUnsafeProtocolOverride` is what stops it.

**Only the allow-lists cover keys nobody has classified yet.** `unsafe` is a finite list, so a git
config key with an exec sink that has not been added to it passes straight through — exactly the v3
fail-open behaviour. Deny-by-default catches it because you never named it.

The short version: **the allow-lists gate the key, `unsafe` gates the value**, and a task must clear
both. When a value is caught by both, the `unsafe` error surfaces first — it runs at the `args`
stage, ahead of the environment filter (`spawnOptions`) and the config-write guard (`beforeSpawn`).

---

## Upgrade guide

### If you used a trailing callback…

Callbacks are gone. Passing a function as the final argument now **throws** a
`TaskConfigurationError` rather than being silently ignored, so a missed migration fails loudly at
the call site.

```diff
- git.init((err, result) => { /* … */ });
- git.add('.', (err, result) => { /* … */ });
+ const result = await git.init();
+ const result = await git.add('.');
```

For error handling, use the promise:

```diff
- git.commit('message', (err, result) => {
-    if (err) return handleError(err);
-    handleResult(result);
- });
+ try {
+    handleResult(await git.commit('message'));
+ } catch (err) {
+    handleError(err);
+ }
```

`exec()` still takes a function — that's a scheduled callback for sequencing, not a task callback,
and it is exempt from the guard.

### If you imported from `simple-git/promise`…

The `/promise` entry point and the `gitP` export no longer exist. The main entry point has been
promise-based since v2, so import it directly:

```diff
- import gitP from 'simple-git/promise';
- const git = gitP(baseDir);
+ import { simpleGit } from 'simple-git';
+ const git = simpleGit(baseDir);
```

```diff
- const gitP = require('simple-git/promise');
+ const { simpleGit } = require('simple-git');
```

### If you relied on `GIT_*` environment variables…

Add each key you need to `allowEnvironment`. Keys are matched case-insensitively.

```diff
- const git = simpleGit(baseDir);
- await git.env('GIT_TERMINAL_PROMPT', '0').fetch();
+ const git = simpleGit(baseDir, { allowEnvironment: ['GIT_TERMINAL_PROMPT'] });
+ await git.env('GIT_TERMINAL_PROMPT', '0').fetch();
```

If the key is also a known vulnerability category, add the matching `unsafe` flag as well:

```diff
- const git = simpleGit(baseDir);
- await git.env('GIT_SSH_COMMAND', 'ssh -i ./deploy-key').fetch();
+ const git = simpleGit(baseDir, {
+    allowEnvironment: ['GIT_SSH_COMMAND'],
+    unsafe: { allowUnsafeSshCommand: true },
+ });
+ await git.env('GIT_SSH_COMMAND', 'ssh -i ./deploy-key').fetch();
```

This applies to variables already in your process environment too — if your CI sets `GIT_DIR` or
`GIT_WORK_TREE` and you were relying on git picking them up, they're now stripped unless named:

```diff
- const git = simpleGit(baseDir);
+ const git = simpleGit(baseDir, { allowEnvironment: ['GIT_DIR', 'GIT_WORK_TREE'] });
```

Remember the failure point is the *task*, not the `.env()` call — if a task starts rejecting with
an `allowEnvironment` error after upgrading, the key it names is the one to add.

### If you set git config…

Add the keys to `allowConfigWrite`. The most common case is committer identity, which has a preset:

```diff
- const git = simpleGit(baseDir);
- await git.addConfig('user.name', 'Test User');
+ const git = simpleGit(baseDir, { allowConfigWrite: [...allowConfigWriteUser] });
+ await git.addConfig('user.name', 'Test User');
```

Construction-time `config` entries are subject to the same guard — being set at construction time
is no longer implicit permission:

```diff
- const git = simpleGit(baseDir, {
-    config: ['core.autocrlf=input', 'http.proxy=http://proxy:8080'],
- });
+ const git = simpleGit(baseDir, {
+    config: ['core.autocrlf=input', 'http.proxy=http://proxy:8080'],
+    allowConfigWrite: ['core.autocrlf', 'http.proxy'],
+ });
```

If any of those keys is a vulnerability category, add its `unsafe` flag too — the error names the
flag it wants:

```diff
  const git = simpleGit(baseDir, {
     config: ['core.pager=cat'],
     allowConfigWrite: ['core.pager'],
+    unsafe: { allowUnsafePager: true },
  });
```

Use wildcards where the exact key varies:

```ts
allowConfigWrite: ['remote.*.url', 'branch.*.remote'];
```

### If you called `.outputHandler()`…

It's now a constructor option, so the handler is in place before the first task spawns. The method
remains only to produce a helpful error.

```diff
- const git = simpleGit(baseDir);
- git.outputHandler((command, stdout, stderr) => {
-    stdout.pipe(process.stdout);
- });
+ const git = simpleGit(baseDir, {
+    outputHandler(command, stdout, stderr, args) {
+       stdout.pipe(process.stdout);
+    },
+ });
```

### If you called `.clearQueue()`…

Deprecated in v2, this method has now been removed completely. Use the abort plugin, which kills
in-flight child process as well as clearing what's pending:

```diff
- git.clearQueue();
+ const controller = new AbortController();
+ const git = simpleGit(baseDir, { abort: controller.signal });
+ // …
+ controller.abort();
```

One controller can be shared across as many instances as you like — every in-flight process is
killed and every pending task rejects. See the
[abort plugin guide](https://github.com/steveukx/git-js/blob/main/docs/PLUGIN-ABORT-CONTROLLER.md).

### If you read a large file into memory…

Where you were buffering output only to consume it incrementally, `stream()` removes the
intermediate copy:

```diff
- const content = await git.showBuffer('HEAD:large-file.bin');
- await writeTo(destination, content);
+ for await (const chunk of await git.stream(showBuffer('HEAD:large-file.bin'))) {
+    await writeTo(destination, chunk);
+ }
```

### If you used deep imports…

The `exports` map is tightened to the documented entry points. Deep imports into the package's
internals aren't guaranteed the way v3's flatter file layout allowed — import from the package root
instead.

---

## Unchanged

These carry over from v3 with the same option names, shapes, and observable behaviour, so existing
configuration keeps working:

| Behaviour | Configuration |
| --- | --- |
| Abort | `abort: AbortSignal` |
| Progress reporting | `progress(event)` |
| Timeout | `timeout: { block, stdOut?, stdErr? }` |
| Completion detection | `completion: { onClose?, onExit? }` |
| Custom binary | `binary`, `git.customBinary()` |
| Error customisation | `errors(error, result)` |
| Unsafe-operation blocking | `unsafe.allowUnsafeCustomBinary`, argv-parser vulnerability flags |
| Spawn options | `spawnOptions: { uid, gid }` |
| Concurrency limit | `maxConcurrentProcesses` (default `5`) |
| Pathspec suffixing | automatic |

Also unchanged: `debug`-based logging (see the
[debug logging guide](https://github.com/steveukx/git-js/blob/main/docs/DEBUG-LOGGING-GUIDE.md)),
the `GitError` / `GitResponseError` / `GitPluginError` / `GitConstructError` /
`TaskConfigurationError` family, and the parsed response shapes returned by each task.
