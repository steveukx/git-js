
# Change History & Release Notes

<!-- Notes added below this line -->
<!-- Template: ${version} -->

## 2.7.0 - Output Handler and logging

- Updated to the `outputHandler` type to add a trailing argument for the arguments passed into the child process.
- All logging now uses the [debug](https://www.npmjs.com/package/debug) library. Enable logging by adding `simple-git`
  to the `DEBUG` environment variable. `git.silent(false)` can still be used to explicitly enable logging and is
  equivalent to calling `require('debug').enable('simple-git')`. 

## 2.6.0 - Native Promises, Typed Errors, TypeScript Importing, Git.clean and Git.raw

### Native Promises

- _TL;DR - `.then` and `.catch` can now be called on the standard `simpleGit` chain to handle the promise
  returned by the most recently added task... essentially, promises now just work the way you would expect
  them to._
- The main export from `simple-git` no longer shows the deprecation notice for using the
  `.then` function, it now exposes the promise chain generated from the most recently run
  task, allowing the combination of chain building and ad-hoc splitting off to a new promise chain.
  - See the [unit](./test/unit/promises.spec.js) and [integration](./test/integration/promise-from-root.spec.js) tests.
  - See the [typescript consumer](./test/consumer/ts-default-from-root.spec.ts) test.

### TypeScript Importing

- Promise / async interface and TypeScript types all available from the `simple-git` import rather than needing
  `simple-git/promise`, see examples in the [ReadMe](./readme.md) or in the [consumer tests](./test/consumer).

### Typed Errors

- Tasks that previously validated their usage and rejected with a `TypeError` will now reject with a
 [`TaskConfigurationError`](./src/lib/errors/task-configuration-error.ts).

- Tasks that previously rejected with a custom object (currently only `git.merge` when the auto-merge fails)
  will now reject with a [`GitResponseError`](./src/lib/errors/git-response-error.ts) where previously it
  was a modified `Error`.

### Git Clean

- `git.clean(...)` will now return a `CleanSummary` instead of the raw string data

### Git Raw

- `git.raw(...)` now accepts any number of leading string arguments as an alternative to the
  single array of strings.

## 2.5.0 - Git.remote

- all `git.remote` related functions converted to TypeScript

## 2.4.0 - Git.subModule

- all `git.subModule` related functions converted to TypeScript

## 2.3.0 - Git.config

- add new `git.listConfig` to get current configuration
- `git.addConfig` supports a new `append` flag to append the value into the config rather than overwrite existing

## 2.2.0 - Git.branch

- all `git.branch` related functions converted to TypeScript
- add new `git.deleteLocalBranches` to delete multiple branches in one call
- `git.deleteLocalBranches` and `git.deleteLocalBranch` now support an optional `forceDelete` flag

## 2.1.0 - Git.tag

- `.tags`, `.addTag` and `.addAnnotatedTag` converted to TypeScript, no backward compatibility changes

## 2.0.0 - Incremental switch to TypeScript and rewritten task execution

- If your application depended on any functions with a name starting with an `_`, the upgrade may not be seamless,
please only use the documented public API.

- `git.log` date format is now strict ISO by default (ie: uses the placeholder `%aI`) instead of the 1.x default of
`%ai` for an "ISO-like" date format. To restore the old behaviour, add `strictDate = false` to the options passed to
`git.log`. 
 

## 1.110.0 - ListLogLine

- The default format expression used in `.log` splits ref data out of the `message` into a property of its own:  `{ message: 'Some commit message (some-branch-name)' }` becomes `{ message: 'Some commit message', refs: 'some-branch-name' }` |
- The commit body content is now included in the default format expression and can be used to identify the content of merge conflicts eg: `{ body: '# Conflicts:\n# some-file.txt' }` | 


## 1.0.0

Bumped to a new major revision in the 1.x branch, now uses `ChildProcess.spawn` in place of `ChildProcess.exec` to
add escaping to the arguments passed to each of the tasks.

