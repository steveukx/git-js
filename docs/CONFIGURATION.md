---
title: Configuration
group: Guides
---

# Configuration

Each `simple-git` instance is configured with an options object passed to the `simpleGit` factory function.
All properties are optional, see
[`SimpleGitOptions`](https://steveukx.github.io/git-js/interfaces/SimpleGitOptions.html) in the API reference
for the full list.

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit({
   baseDir: process.cwd(),
   binary: 'git',
   maxConcurrentProcesses: 6,
   trimmed: false,
});

// or split out the baseDir, supported for backward compatibility
const other = simpleGit('/some/path', { binary: 'git' });
```

The first argument can be either a string (the working directory for `git` commands to run in), a
`SimpleGitOptions` object or `undefined`, the second argument is an optional `SimpleGitOptions` object.

## Per-command configuration

To prefix every command run by an instance with configuration that isn't saved in the git config (ie: using the
`-c` switch), supply a `config` option:

```typescript
const git = simpleGit('/some/path', { config: ['http.proxy=someproxy'] });

// runs: git -c http.proxy=someproxy pull
await git.pull();
```

Configuration keys that aren't in the built-in list of known-safe keys must also be named in the `allowConfig`
option, see [Allow Config](./PLUGIN-UNSAFE-ACTIONS.md#allow-config).

## Environment variables

Pass environment variables to the `git` child processes with `git.env`, either one at a time or as an object that
replaces the whole environment:

```typescript
const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';

await simpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] })
   .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
   .status();

await simpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] })
   .env({ ...process.env, GIT_SSH_COMMAND })
   .status();
```

When passing an object, it replaces the standard `process.env` variables - the example above creates a new object
based on `process.env` with the `GIT_SSH_COMMAND` property added.

Variables that change how `git` runs (any `GIT_` prefixed variable, plus others such as `EDITOR` and `PAGER`) are
only passed to `git` when named in the `allowEnvironment` option, see
[Allow Environment](./PLUGIN-UNSAFE-ACTIONS.md#allow-environment).

## Authentication

The simplest way to supply a username / password to the remote host is to include it in the URL:

```typescript
const USER = 'something';
const PASS = 'somewhere';
const REPO = 'github.com/username/private-repo';

await simpleGit().clone(`https://${USER}:${PASS}@${REPO}`);
```

Don't enable debug logging when using this mechanism, to ensure passwords aren't logged.

## Plugins

Plugins are enabled through the options object, each has its own guide:

| Plugin | What it does |
| --- | --- |
| [AbortController](./PLUGIN-ABORT-CONTROLLER.md) | Terminate pending and future tasks in a `simple-git` instance. |
| [Allow Config](./PLUGIN-UNSAFE-ACTIONS.md#allow-config) | Name the `git` configuration keys tasks may set, beyond the built-in list of known-safe keys. |
| [Allow Environment](./PLUGIN-UNSAFE-ACTIONS.md#allow-environment) | Name the environment variables to allow through to the `git` child processes. |
| [Completion Detection](./PLUGIN-COMPLETION-DETECTION.md) | Customise how `simple-git` detects the end of a `git` process. |
| [Custom Binary](./PLUGIN-CUSTOM-BINARY.md) | Customise the `git` binary used when spawning `git` child processes. |
| [Error Detection](./PLUGIN-ERRORS.md) | Customise the detection of errors from the underlying `git` process. |
| [Progress Events](./PLUGIN-PROGRESS-EVENTS.md) | Receive progress events as `git` works through long-running processes. |
| [Spawned Process Ownership](./PLUGIN-SPAWN-OPTIONS.md) | Configure the system `uid` / `gid` to use for spawned `git` processes. |
| [StdIn](./PLUGIN-INPUT.md) | Send content to the `stdin` stream of the `git` child process. |
| [Timeout](./PLUGIN-TIMEOUT.md) | Automatically kill the wrapped `git` process after a rolling timeout. |
| [Unsafe](./PLUGIN-UNSAFE-ACTIONS.md) | Selectively opt out of `simple-git` safety precautions - for advanced users and use cases. |
