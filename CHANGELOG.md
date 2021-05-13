# Change History & Release Notes

## [2.39.0](https://www.github.com/steveukx/git-js/compare/v2.38.1...v2.39.0) (2021-05-13)


### Features

* `git.cwd` can now be configured to affect just the chain rather than root instance. ([4110662](https://www.github.com/steveukx/git-js/commit/411066241c014c609d18a37e128c38f2c947c6e7))

### [2.38.1](https://www.github.com/steveukx/git-js/compare/v2.38.0...v2.38.1) (2021-05-09)


### Bug Fixes

* Export `GitPluginError` from the main package. ([2aa7e55](https://www.github.com/steveukx/git-js/commit/2aa7e55216cdf57ca905cd6c23ff6b71002450c6)), closes [#616](https://www.github.com/steveukx/git-js/issues/616)

## [2.38.0](https://www.github.com/steveukx/git-js/compare/v2.37.0...v2.38.0) (2021-04-14)


### Features

* Support enabling / disabling `debug` logs programmatically. ([#610](https://www.github.com/steveukx/git-js/issues/610)) ([c901b9c](https://www.github.com/steveukx/git-js/commit/c901b9c9e1913ccf8d5d630396f1753d057cd851))

## [2.37.0](https://www.github.com/steveukx/git-js/compare/v2.36.2...v2.37.0) (2021-03-15)


### Features

* `errorDetectionPlugin` to handle creating error messages when tasks fail. ([c65a419](https://www.github.com/steveukx/git-js/commit/c65a4197e36b5c6f0b2afab46668ab092620a6cc))

### [2.36.2](https://www.github.com/steveukx/git-js/compare/v2.36.1...v2.36.2) (2021-03-11)


### Bug Fixes

* Export missing `SimpleGitProgressEvent` ([038870e](https://www.github.com/steveukx/git-js/commit/038870eb9ae35be78c1dd7fe1977ad8ba35913f2)), closes [#601](https://www.github.com/steveukx/git-js/issues/601)

### [2.36.1](https://www.github.com/steveukx/git-js/compare/v2.36.0...v2.36.1) (2021-03-06)


### Bug Fixes

* Documentation update for `outputHandler` ([775d81e](https://www.github.com/steveukx/git-js/commit/775d81e4decac8677e879e591e519fbbb6996667))
* Support parsing `git.branch` where branches have carriage returns in the commit detail. ([5b71012](https://www.github.com/steveukx/git-js/commit/5b710125a5afde5fc1310c5a092cc7c48930c9bb))

## [2.36.0](https://www.github.com/steveukx/git-js/compare/v2.35.2...v2.36.0) (2021-03-03)


### Features

* Timeout Plugin ([59f3d98](https://www.github.com/steveukx/git-js/commit/59f3d98017b27c251c71758e4641a6aa055549f5))


### Bug Fixes

* Fix broken link in `no-response` auto-generated comment ([16fe73f](https://www.github.com/steveukx/git-js/commit/16fe73f36514a827d9aa8ea6b9f33b6aa0ea575d))

### [2.35.2](https://www.github.com/steveukx/git-js/compare/v2.35.1...v2.35.2) (2021-02-23)


### Bug Fixes

* Progress plugin should request progress events for fetch as well as other common long running tasks. ([ea68857](https://www.github.com/steveukx/git-js/commit/ea688570fb444afdaa442d69f8111fd24ef53844))
* upgrade debug from 4.3.1 to 4.3.2 ([4b6eda8](https://www.github.com/steveukx/git-js/commit/4b6eda85277a549d408d1449284b0bc03fb93c48))
* While use of the `ListLogSummary` type is deprecated in favour of the new `LogResult`, the alias type should also support the default generic `DefaultLogFields` to allow downstream consumers to upgrade to newer `2.x` versions without the need to specify a generic. ([508e602](https://www.github.com/steveukx/git-js/commit/508e6021716cb220fbf8fca9a57a3616d2246a51)), closes [#586](https://www.github.com/steveukx/git-js/issues/586)

### [2.35.1](https://www.github.com/steveukx/git-js/compare/v2.35.0...v2.35.1) (2021-02-19)


### Bug Fixes

* Update documentation for configuring `SimpleGit` - `options` should be a `Partial<SimpleGitOptions>` to allow for supplying just some of its properties. ([30523df](https://www.github.com/steveukx/git-js/commit/30523dff5bcd483b8fa778ae73caaa84057faad4)), closes [#580](https://www.github.com/steveukx/git-js/issues/580)

## [2.35.0](https://www.github.com/steveukx/git-js/compare/v2.34.2...v2.35.0) (2021-02-16)


### Features

* Progress Handler ([5508bd4](https://www.github.com/steveukx/git-js/commit/5508bd4b10c7bb5233f93446931cdaa90ffeae4f))

### [2.34.2](https://www.github.com/steveukx/git-js/compare/v2.34.1...v2.34.2) (2021-02-07)


### Bug Fixes

* fix npm publish token definition ([fb066c3](https://www.github.com/steveukx/git-js/commit/fb066c379fcf60423348f827238521350087474d))

### [2.34.1](https://www.github.com/steveukx/git-js/compare/v2.34.0...v2.34.1) (2021-02-07)


### Bug Fixes

* auto-release with release-please ([0ed2d96](https://www.github.com/steveukx/git-js/commit/0ed2d9695ef3ee4136df12dd59802d7faaf710a6))

## [2.34.0](https://www.github.com/steveukx/git-js/compare/v2.33.0...v2.34.0) (2021-02-06)


### Features

* refactor `git push` to TypeScript `SimpleGitBase` interface ([e77ef1b](https://www.github.com/steveukx/git-js/commit/e77ef1b1adf89722571fca3f3547b5d8dfbc9d84))
* refactor `git push` to TypeScript `SimpleGitBase` interface ([0691e85](https://www.github.com/steveukx/git-js/commit/0691e855124e2dc5fdb3403ada30afcd157047c4))

## [2.33.0](https://www.github.com/steveukx/git-js/compare/v2.32.0...v2.33.0) (2021-02-06)


### Features

* automate release/changelog with release-please ([3848494](https://www.github.com/steveukx/git-js/commit/384849488ada32f18c84eea22aad7b9ceb2000b5))
* split the `git.add` into the ts `SimpleGitApi` ([14432f9](https://www.github.com/steveukx/git-js/commit/14432f9879744cafa043c0fbeee00b37db726f81))

## 2.32.0 Per-command Configuration

- Supports passing configuration arguments to the `git` binary (via its `-c` argument as a prefix to any other
  arguments). Eg: to supply some custom http proxy to a `git pull` command, use
  `simpleGit('/some/path', { config: ['http.proxy=someproxy'] }).pull()` 
- Add deprecation notice to `git.silent`
- Internal Updates:
  - switch from `run` to `runTask` in `git` core
  - finish converting all mocks to TypeScript

## 2.31.0 Handle 'root' commit syntax  

- Adds a `root: boolean` property to the `CommitResult` interface representing whether the commit was a 'root' commit
  (which is a commit that has no parent, most commonly the first commit in a repo).

## 2.30.0 Restore compatibility with Node.js v10

- Reinstates native support for node.js v10 by removing use of ES6 constructs

## 2.29.0 Update TypeScript response type for `git.mergeFromTo`

- Update type definition for `git.mergeFromTo` to be the `MergeResult` returned
  when using the more generic `git.merge` method.
  Thanks to [@ofirelias](https://github.com/ofirelias) for the pull request.

## 2.28.0 Add support for `git apply` & TypeScript Integration Tests

- Adds support for `git.applyPatch` to apply patches generated in a `git diff` to the working index,
  TypeScript consumers can make use of the `ApplyOptions` type definition to make use of strong types
  for the supported options. Thanks to [@andreterron](https://github.com/andreterron) for the pull request.

- Integration tests converted to TypeScript to ensure type safety across all tests.

## 2.27.0 Included staged delete/modify in StatusResult staged array  

-  Update the `git.status` parser to account for staged deleted/modified files and staged files with subsequent
   modifications meaning a status of:
   - `RM old -> new` will now appear in `renamed` and `new` will also appear in `modified`
   - `D  file` will now appear in both `deleted` and `staged` where ` D file` would only appear in `deleted`
  
## 2.26.0 Fix error when using `git.log` with callback

- Resolves an issue whereby using `git.log` with a callback (or awaiting the promise created from the now deprecated
  `simple-git/promise` import) would fail to return the response to the caller. 

## 2.25.0 TypeScript Types & Unit Tests, Commit Parsing

- See [Legacy Node Versions](./docs/LEGACY_NODE_VERSIONS.md) for details of how to use `simple-git` with `node.js`
  versions 11 and below.  
- To help keep the TypeScript definitions in line with functionality, unit tests are now written in TypeScript.
- When using `git.commit`, the first argument must be a string or array of strings. Passing another data type has long
  been considered an error, but now a deprecation warning will be shown in the log and will be switched to an error
  in version 3.
- Fixes an issue in `git.commit` whereby a commit that included only deleted lines would be parsed as though the
  deletions were inclusions. 

## 2.24.0 Types updated

- `pull`, `push` and `pushTags` parameter types updated to match new functionality and tests switched to TypeScript to ensure they are kept in sync

## 2.23.0 update `debug` dependency & `master` -> `main`

- Upgrade `debug` dependency and remove use of now deprecated `debug().destroy()`
- Renames the default source branch from `master` to `main`

## 2.22.0 add `git.hashObject` interface

- Adds support for `git hash-object FILE` and `git hash-object -w FILE`
  with new interface `git.hashObject(...)`, with thanks to [@MiOnim](https://github.com/MiOnim)

## 2.21.0 add `string[]` to `LogOptions` type

- Adds `string[]` to the set of types supported as options for `git.log`
- Fix readme typos 

## 2.20.1 Bug-fix: `LogOptions` type definition

- `LogOptions` should be intersection rather than union types

## 2.19.0 - Upgrade task option filters

- move the command/task option processing function to TypeScript

## 2.18.0 - Upgrade Clone / Mirror tasks

- `git.clone` and `git.mirror` rewritten to fit the TypeScript tasks style.
- resolves issue whereby `git.clone` didn't accept an object of options despite being documented as supporting.

## 2.17.0 - Add remote message parsing to `git pull`

- `git pull` (and by extension `git merge`) adds remote message parsing to the `PullResult` type
- Remote message parsing adds property `remoteMessages.objects` of type `RemoteMessagesObjectEnumeration` to capture the  objects transferred in fetch and push.

## 2.16.0 - Upgrade Move task

- `git.mv` rewritten to fit the TypeScript tasks style.
- set up github actions for CI

## 2.15.0 - Task parsers automatically have access to `stdErr` as well as `stdOut` 

- adds the `TaskParser` type to describe a task's parser function and creates the `LineParser` utility to simplify line-by-line parsing of string responses.
- renames some interfaces for consistency of naming, the original name remains as a type alias marked as `@deprecated` until version 3.x:
  - BranchDeletionSummary > BranchSingleDeleteResult
  - BranchDeletionBatchSummary > BranchMultiDeleteResult
  - MergeSummary > MergeResult

## 2.14.0 - Bug fix: `git.checkoutBranch` fails to pass commands to git child process

- resolves an issue whereby the `git.checkoutBranch` method would not pass the branch detail through to the underlying child process.

## 2.13.2 - PushResult to expose all non-empty remote messages

- Further to `2.13.0` includes all (non-empty) `remote:` lines in the `PushResult`,
  including `remote:` lines used for other parser results (ie: `pullRequestUrl` etc).

## 2.13.1 - Add support for parsing GitLab Pull Request Url Message

- Further to `2.13.0` adding support for parsing the reponse to `git.push`, adds support for the pull request message
  used by gitlab.

## 2.13.0 - Upgraded Pull & Merge and parser for Push  

- `.push` and `.pushTags` rewritten as v2 style tasks. The git response is now parsed and returned as a
  [PushResult](./typings/response.d.ts)

- Pull and merge rewritten to fit the TypeScript tasks style. 

- Integration tests updated to run through jest directly without compiling from nodeunit

## 2.12.0 - Bug fix: chaining onto / async awaiting `git.tags` failed

- resolves an issue whereby the `git.tags` method could not be chained or used as an async/promise.

## 2.11.0 - Parallel / concurrent tasks, fresh repo status parser & bug-fix in `checkoutLocalBranch`

- until now, `simple-git` reject all pending tasks in the queue when a task has failed. From `2.11.0`, only
  tasks chained from the failing one will be rejected, other tasks can continue to be processed as normal,
  giving the developer more control over which tasks should be treated as atomic chains, and which can be
  [run in parallel](./readme.md#concurrent--parallel-requests).
  
  To support this, and to prevent the issues seen when `git` is run concurrently in too many child processes,
  `simple-git` will limit the number of tasks running in parallel at any one time to be at most 1 from each
  chain (ie: chained tasks are still run in series) and at most 5 tasks across all chains (
  [configurable](./readme.md#configuration) by passing `{maxConcurrentProcesses: x}` in the `simpleGit` constructor). 

- add support to `git.status()` for parsing the response of a repo that has no commits yet, previously
  it wouldn't determine the branch name correctly.

- resolved a flaw introduced in `2.9.0` whereby `checkoutLocalBranch` would silently fail and not check out the branch 

## 2.10.0 - trailing options in checkout, init, status, reset & bug-fix awaiting a non-task

- `git.checkout` now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit from 'simple-git';
await simpleGit().checkout('branch-name', ['--track', 'remote/branch']);
await simpleGit().checkout(['branch-name', '--track', 'remote/branch']);
await simpleGit().checkout({'branch-name': null});
```

- `git.init` now supports both object and array forms of supplying trailing options and now
  parses the response to return an [InitResult](./typings/response.d.ts);

```typescript
import simpleGit, { InitResult } from 'simple-git';
const notSharedInit: InitResult = await simpleGit().init(false, ['--shared=false']);
const notSharedBareInit: InitResult = await simpleGit().init(['--bare', '--shared=false']);
const sharedInit: InitResult = await simpleGit().init(false, {'--shared': 'true'});
const sharedBareInit: InitResult = await simpleGit().init({'--bare': null, '--shared': 'false'});
```

- `git.status` now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit, { StatusResult } from 'simple-git';
const repoStatus: StatusResult = await simpleGit().status();
const subDirStatus: StatusResult = await simpleGit().status(['--', 'sub-dir']);
```

- `git.reset` upgraded to the new task style and exports an enum `ResetMode` with all supported
  merge modes and now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit, { ResetMode } from 'simple-git';

// git reset --hard
await simpleGit().reset(ResetMode.HARD);

// git reset --soft -- sub-dir
await simpleGit().reset(ResetMode.SOFT, ['--', 'sub-dir']);
```

- bug-fix: it should not be possible to await the `simpleGit()` task runner, only the tasks it returns.

```typescript
expect(simpleGit().then).toBeUndefined();
expect(simpleGit().init().then).toBe(expect.any(Function));
```

## 2.9.0 - checkIsRepo, rev-parse 

- `.checkIsRepo()` updated to allow choosing the type of check to run, either by using the exported `CheckRepoActions` enum
  or the text equivalents ('bare', 'root' or 'tree'):
  - `checkIsRepo(CheckRepoActions.BARE): Promise<boolean>` determines whether the working directory represents a bare repo.
  - `checkIsRepo(CheckRepoActions.IS_REPO_ROOT): Promise<boolean>` determines whether the working directory is at the root of a repo.
  - `checkIsRepo(CheckRepoActions.IN_TREE): Promise<boolean>` determines whether the working directory is a descendent of a git root.

- `.revparse()` converted to a new style task

## 2.8.0 - Support for `default` import in TS without use of `esModuleInterop`

- Enables support for using the default export of `simple-git` as an es module, in TypeScript it is no
  longer necessary to enable the `esModuleInterop` flag in the `tsconfig.json` to consume the default
  export.

### 2.7.2 - Bug Fix: Remove `promise.ts` source from `simple-git` published artifact

- Closes #471, whereby the source for the promise wrapped runner would be included in the published artifact
  due to sharing the same name as the explicitly included `promise.js` in the project root. 

### 2.7.1 - Bug Fix: `await git.log` having imported from root `simple-git`

- Fixes #464, whereby using `await` on `git.log` without having supplied a callback would ignore the leading options
  object or options array. 

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
 

## v1 and below

Please see the [historical changelog](./docs/CHANGELOG-HISTORICAL.md);
