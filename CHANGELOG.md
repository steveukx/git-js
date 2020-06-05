
# Change History & Release Notes

<!-- Notes added below this line -->
<!-- Template: ${version} -->

## 2.6.0 - Native Promises, TypeScript Importing and Git.clean

- The main export from `simple-git` no longer shows the deprecation notice for using the
  `.then` function, it now exposes the promise chain generated from the most recently run
  task, allowing the combination of chain building and ad-hoc splitting off to a new promise chain.
  - See the [unit](./test/unit/promises.spec.js) and [integration](./test/integration/promise-from-root.spec.js) tests.
  - See the [typescript consumer](./test/consumer/ts-default-from-root.spec.ts) test.
- Promise / async interface and TypeScript types all available from the `simple-git` import rather than needing
  `simple-git/promise`, see examples in the [ReadMe](./readme.md) or in the [consumer tests](./test/consumer).
- `git.clean(...)` will now return a `CleanSummary` instead of the raw string data

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

