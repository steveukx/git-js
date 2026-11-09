# Simple Git

[![NPM version](https://img.shields.io/npm/v/simple-git.svg)](https://www.npmjs.com/package/simple-git)

A lightweight interface for running `git` commands in any [node.js](https://nodejs.org) application.

**[Read the full documentation](https://steveukx.github.io/git-js/)** for the API reference, guides and examples.

## Installation

Requires [git](https://git-scm.com/downloads) to be installed and callable using the command `git`.

```shell
npm install simple-git
```

Or use your favourite package manager: `yarn add simple-git` / `pnpm add simple-git`.

## Usage

`simple-git` can be used as an ES Module, CommonJS module, and includes TypeScript type definitions:

```typescript
import { simpleGit } from 'simple-git';
// or: const { simpleGit } = require('simple-git');

const git = simpleGit('/path/to/repo');

const status = await git.status();
console.log(`On branch ${status.current} with ${status.files.length} changed files`);
```

Every task returns a promise, and tasks can be chained together to run in series:

```typescript
await simpleGit()
   .init()
   .add('./*')
   .commit('first commit!')
   .addRemote('origin', 'https://github.com/user/repo.git')
   .push(['-u', 'origin', 'main']);
```

When there is no task for the command you need, use `git.raw` with an array of arguments, or `git.cmd` to include
untrusted data in a command (see [security](#security) below).

## Documentation

- [API reference](https://steveukx.github.io/git-js/interfaces/SimpleGit.html) - every task, its options and
  response types.
- Guides:
  [configuration](https://github.com/steveukx/git-js/blob/main/docs/CONFIGURATION.md),
  [running tasks](https://github.com/steveukx/git-js/blob/main/docs/RUNNING-TASKS.md) (promises, options,
  errors and concurrency),
  [troubleshooting](https://github.com/steveukx/git-js/blob/main/docs/TROUBLESHOOTING.md) and
  [debug logging](https://github.com/steveukx/git-js/blob/main/docs/DEBUG-LOGGING-GUIDE.md).
- Examples:
  [setting up repositories](https://github.com/steveukx/git-js/blob/main/examples/repository-setup.md),
  [commits and history](https://github.com/steveukx/git-js/blob/main/examples/commits-and-history.md),
  [remotes and syncing](https://github.com/steveukx/git-js/blob/main/examples/remotes-and-syncing.md),
  [handling untrusted input](https://github.com/steveukx/git-js/blob/main/examples/untrusted-input.md) and
  [more](https://github.com/steveukx/git-js/tree/main/examples).
- Plugins: abort controllers, timeouts, progress events, custom binaries and more - see the
  [configuration guide](https://github.com/steveukx/git-js/blob/main/docs/CONFIGURATION.md#plugins).

## Security

`simple-git` runs the `git` binary with arguments built by your application. Read the
[security policy](https://github.com/steveukx/git-js/blob/main/SECURITY.md) to find out which inputs are safe for
data from untrusted sources, and use `git.cmd` when a command needs to include untrusted data:

```typescript
import { pathspec, refName, remoteUrl, simpleGit } from 'simple-git';

const git = simpleGit({ strictConfig: true });
await git.cmd`clone --depth 1 ${remoteUrl(url)} ${pathspec(target)}`;
await git.cmd`checkout -b ${refName(branch)}`;
```

Report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/steveukx/git-js/security/advisories/new).

## Upgrading to v4

Version 4 standardises how the library is loaded and initialised, and reduces attack vectors by blocking the use
of abbreviated `git` options in commands. The library is no longer published with the deprecated `/promise` or
default entry points, so import the named `simpleGit` export. Read the
[migration guide](https://github.com/steveukx/git-js/blob/main/docs/RELEASE-NOTES-V4.md) for step-by-step examples.

Release notes: [v4](https://github.com/steveukx/git-js/blob/main/docs/RELEASE-NOTES-V4.md),
[v3 changelog](https://github.com/steveukx/git-js/blob/main/simple-git/CHANGELOG.md),
[v2](https://github.com/steveukx/git-js/blob/main/docs/RELEASE-NOTES-V2.md).
