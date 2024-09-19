# Change History & Release Notes

## 3.27.0

### Minor Changes

-  52f767b: Add `similarity` to the `DiffResultNameStatusFile` interface used when fetching log/diff with the `--name-status` option.
-  739b0d9: Diff summary includes original name of renamed files when run wiht the `--name-status` option.
-  bc90e7e: Fixes an issue with reporting name changes in the `files` array returned by `git.status`.
   Thank you @mark-codesphere for the contribution.

### Patch Changes

-  03e1c64: Resolve error in log parsing when fields have empty values.

## 3.26.0

### Minor Changes

-  28d545b: Upgrade build tools and typescript

## 3.25.0

### Minor Changes

-  0a5378d: Add support for parsing `count-objects`

### Patch Changes

-  4aceb15: Upgrade dependencies and build tools

## 3.24.0

### Minor Changes

-  c355317: Enable the use of a two part custom binary

## 3.23.0

### Minor Changes

-  9bfdf08: Bump package manager from yarn v1 to v4

### Patch Changes

-  8a3118d: Fixed a performance issue when parsing stat diff summaries
-  9f1a174: Update build tools and workflows for Yarn 4 compatibility

## 3.22.0

### Minor Changes

-  df14065: add status to DiffResult when using --name-status

## 3.21.0

### Minor Changes

-  709d80e: Add firstCommit utility interface

### Patch Changes

-  b4ab430: Add trailing callback support to git.firstCommit
-  d3f9320: chore(deps): bump @babel/traverse from 7.9.5 to 7.23.2
-  b76857f: chore(deps): bump axios from 1.1.3 to 1.6.1

## 3.20.0

### Minor Changes

-  2eda817: Use `pathspec` in `git.log` to allow use of previously deleted files in `file` argument

## 3.19.1

### Patch Changes

-  2ab1936: keep path splitter without path specs

## 3.19.0

### Minor Changes

-  f702b61: Create a utility to append pathspec / file lists to tasks through the TaskOptions array/object

## 3.18.0

### Minor Changes

-  5100f04: Add new interface for showBuffer to allow using `git show` on binary files.

### Patch Changes

-  f54cd0d: Examples and documentation for outputHandler

## 3.17.0

### Minor Changes

-  a63cfc2: Timeout plugin can now be configured to ignore data on either stdOut or stdErr in the git process when determining whether to kill the spawned process.

## 3.16.1

### Patch Changes

-  066b228: Fix overly permissive regex in push parser

## 3.16.0

### Minor Changes

-  97fde2c: Support the use of `-B` in place of the default `-b` in checkout methods
-  0a623e5: Adds vulnerability detection to prevent use of `--upload-pack` and `--receive-pack` without explicitly opting in.

### Patch Changes

-  ec97a39: Include restricting the use of git push --exec with other allowUnsafePack exclusions, thanks to @stsewd for the suggestion.

## 3.15.1

### Patch Changes

-  de570ac: Resolves an issue whereby non-strings can be passed into the config switch detector.

## 3.15.0

### Minor Changes

-  7746480: Disables the use of inline configuration arguments to prevent unitentionally allowing non-standard remote protocols without explicitly opting in to this practice with the new `allowUnsafeProtocolOverride` property having been enabled.

### Patch Changes

-  7746480: - Upgrade repo dependencies - lerna and jest
   -  Include node@19 in the test matrix

## 3.14.1

### Patch Changes

-  5a2e7e4: Add version parsing support for non-numeric patches (including "built from source" style `1.11.GIT`)

## 3.14.0

### Minor Changes

-  19029fc: Create the abort plugin to allow cancelling all pending and future tasks.
-  4259b26: Add `.version` to return git version information, including whether the git binary is installed.

## 3.13.0

### Minor Changes

-  87b0d75: Increase the level of deprecation notices for use of `simple-git/promise`, which will be fully removed in the next major
-  d0dceda: Allow supplying just one of to/from in the options supplied to git.log

### Patch Changes

-  6b3e05c: Use shared test utilities bundle in simple-git tests, to enable consistent testing across packages in the future

## 3.12.0

### Minor Changes

-  bfd652b: Add a new configuration option to enable trimming white-space from the response to `git.raw`

## 3.11.0

### Minor Changes

-  80d54bd: Added fields updated + deleted branch info to fetch response, closes [#823](https://github.com/steveukx/git-js/issues/823)

### Patch Changes

-  75dfcb4: Add prettier configuration and apply formatting throughout.

## 3.10.0

### Minor Changes

-  2f021e7: Support for importing as an ES module with TypeScript moduleResolution `node16` or newer by adding
   `simpleGit` as a named export.

## 3.9.0

### Minor Changes

-  a0d4eb8: Branches that have been checked out as a [linked work tree](https://git-scm.com/docs/git-worktree) will now be included in the `BranchSummary` output, with a `linkedWorkTree` property set to `true` in the `BranchSummaryBranch`.

## 3.8.0

### Minor Changes

-  25230cb: Support for additional log formats in diffSummary / log / stashList.

   Adds support for the `--numstat`, `--name-only` and `--name-stat` in addition to the existing `--stat` option.

### Patch Changes

-  2cfc16f: Update CI environments to run build and test in node v18, drop node v12 now out of life.
-  13197f1: Update `debug` dependency to latest `4.x`

## 3.7.1

### Patch Changes

-  adb4346: Resolves issue whereby renamed files no longer appear correctly in the response to `git.status`.

## 3.7.0

### Minor Changes

-  fa2c7f7: Enable the use of types when loading with module-resolution

### Patch Changes

-  3805f6b: Timeout plugin no longer keeps short lived processes alive until timeout is hit

## 3.6.0

### Minor Changes

-  f2fc5c9: Show full commit hash in a `CommitResult`, prior to this change `git.commit` would result in a partial hash in the `commit` property if `core.abbrev` is unset or has a value under `40`. Following this change the `commit` property will contain the full commit hash.

### Patch Changes

-  c4a2a13: chore(deps): bump minimist from 1.2.5 to 1.2.6

## 3.5.0

### Minor Changes

-  2040de6: Resolves potential command injection vulnerability by preventing use of `--upload-pack` in `git.clone`

## 3.4.0

### Minor Changes

-  ed412ef: Use null separators in git.status to allow for non-ascii file names

## 3.3.0

### Minor Changes

-  d119ec4: Resolves potential command injection vulnerability by preventing use of `--upload-pack` in `git.fetch`

## 3.2.6

### Patch Changes

-  80651d5: Resolve issue in prePublish script

## 3.2.5

### Patch Changes

-  ac4f38f: Show readme in published package.

## 3.2.4

### Patch Changes

-  d35987b: Release with changesets

## 3.2.3

### Patch Changes

-  1e4c591: Release with changesets

## 3.2.2

### Patch Changes

-  497d416: Releasing with changeset

## 3.2.1

### Patch Changes

-  0c3085d: Releasing library through changesets

## 3.2.0

### Minor Changes

-  b47aa19: Switch to `changesets` as version and changelog manager

### [3.1.1](https://www.github.com/steveukx/git-js/compare/simple-git-v3.1.0...simple-git-v3.1.1) (2022-01-26)

### Bug Fixes

-  specify repository with `directory` identifier to be discoverable within monorepo ([655e23c](https://www.github.com/steveukx/git-js/commit/655e23ce70e94e9213a0da2001ad883966c37b2e))

## [3.1.0](https://www.github.com/steveukx/git-js/compare/simple-git-v3.0.4...simple-git-v3.1.0) (2022-01-23)

### Features

-  optionally include ignored files in `StatusResult` ([70e6767](https://www.github.com/steveukx/git-js/commit/70e676759012d26ab644644e10f7957fba51ae2f)), closes [#718](https://www.github.com/steveukx/git-js/issues/718)

### [3.0.4](https://www.github.com/steveukx/git-js/compare/simple-git-v3.0.3...simple-git-v3.0.4) (2022-01-23)

### Bug Fixes

-  support parsing empty responses ([91eb7fb](https://www.github.com/steveukx/git-js/commit/91eb7fb01fe466468537621cb94b9f932026506e)), closes [#713](https://www.github.com/steveukx/git-js/issues/713)

### [3.0.3](https://www.github.com/steveukx/git-js/compare/simple-git-v3.0.2...simple-git-v3.0.3) (2022-01-20)

### Bug Fixes

-  allow branches without labels ([07a1388](https://www.github.com/steveukx/git-js/commit/07a138808fb0b78068da83030698a957e567541c))
-  implement v3 deprecations ([ed6d18e](https://www.github.com/steveukx/git-js/commit/ed6d18e88a6a4f9fd18d4733a94b491e0e9e3ba1))
-  publish v3 as `latest` ([5db4434](https://www.github.com/steveukx/git-js/commit/5db4434d00acba560fe2569c04f9813cde026468))

### [3.0.2](https://www.github.com/steveukx/git-js/compare/simple-git-v3.0.1...simple-git-v3.0.2) (2022-01-18)

### Bug Fixes

-  Backward compatibility - permit loading `simple-git/promise` with deprecation notice until mid-2022. ([4413c47](https://www.github.com/steveukx/git-js/commit/4413c47fa3d9893734a5bb06075b962645f73cb9))

### [3.0.1](https://www.github.com/steveukx/git-js/compare/simple-git-v3.0.0...simple-git-v3.0.1) (2022-01-18)

### Bug Fixes

-  Documentation update ([4e000f6](https://www.github.com/steveukx/git-js/commit/4e000f69aa876b3999ec98fe42e94186facd5790))

## [3.0.0](https://www.github.com/steveukx/git-js/compare/simple-git-v2.48.0...simple-git-v3.0.0) (2022-01-16)

### ⚠ BREAKING CHANGES

-  monorepo structure (#716)

### Features

-  monorepo structure ([#716](https://www.github.com/steveukx/git-js/issues/716)) ([777a02a](https://www.github.com/steveukx/git-js/commit/777a02a37b3f6345fad86e7ab0105414755c940a))

## [2.48.0](https://www.github.com/steveukx/git-js/compare/v2.47.1...v2.48.0) (2021-12-01)

### Features

-  `StatusResult` returned by `git.status()` should include `detached` state of the working copy. ([#695](https://www.github.com/steveukx/git-js/issues/695)) ([f464ebe](https://www.github.com/steveukx/git-js/commit/f464ebe567c6c5cd4e99fd7e6300d9efdd4cbb1b))

### Bug Fixes

-  Add example for empty commit message in `git.commit()` ([61089cb](https://www.github.com/steveukx/git-js/commit/61089cbcb791acf9dc596dcc903e7b9c6c76c0e1))

### [2.47.1](https://www.github.com/steveukx/git-js/compare/v2.47.0...v2.47.1) (2021-11-29)

### Bug Fixes

-  Add support for node@17 in unit tests ([0d3bf47](https://www.github.com/steveukx/git-js/commit/0d3bf479dd52e68e3af502685568c8e376ba2af3))
-  Add support for node@17 in unit tests ([0d3bf47](https://www.github.com/steveukx/git-js/commit/0d3bf479dd52e68e3af502685568c8e376ba2af3))

## [2.47.0](https://www.github.com/steveukx/git-js/compare/v2.46.0...v2.47.0) (2021-10-19)

### Features

-  git-grep ([653065e](https://www.github.com/steveukx/git-js/commit/653065ebb19bb6718466fc00d9c77047b83aca5d))

## [2.46.0](https://www.github.com/steveukx/git-js/compare/v2.45.1...v2.46.0) (2021-09-29)

### Features

-  `completion` plugin ([#684](https://www.github.com/steveukx/git-js/issues/684)) ([ecb7bd6](https://www.github.com/steveukx/git-js/commit/ecb7bd6688b5e6d970cf64ac36ebb4c2bf7f081a))
-  `completion` plugin to allow configuring when `simple-git` determines the `git` tasks to be complete. ([ecb7bd6](https://www.github.com/steveukx/git-js/commit/ecb7bd6688b5e6d970cf64ac36ebb4c2bf7f081a))

### [2.45.1](https://www.github.com/steveukx/git-js/compare/v2.45.0...v2.45.1) (2021-09-04)

### Bug Fixes

-  support progress events in locales other than western european character sets. ([8cc42f8](https://www.github.com/steveukx/git-js/commit/8cc42f83b5cb99de5b2960bf0cada2a259d09d57))

## [2.45.0](https://www.github.com/steveukx/git-js/compare/v2.44.0...v2.45.0) (2021-08-27)

### Features

-  Use author email field that respects mailmap ([589d624](https://www.github.com/steveukx/git-js/commit/589d62419139ce5ace5081c9c9ae77f83d3f85ab))

### Bug Fixes

-  getConfig always returns `null` despite values being present in configuration ([9fd483a](https://www.github.com/steveukx/git-js/commit/9fd483aa88ee3f6f8674978b36f08811cfb8812a))

## [2.44.0](https://www.github.com/steveukx/git-js/compare/v2.43.0...v2.44.0) (2021-08-14)

### Features

-  add support for getting the current value of a git configuration setting based on its name. ([1d09204](https://www.github.com/steveukx/git-js/commit/1d09204526556a76c5b82979842e6ba5018b083e))

## [2.43.0](https://www.github.com/steveukx/git-js/compare/v2.42.0...v2.43.0) (2021-08-13)

### Features

-  task callback types defined as single function type ([b0a832c](https://www.github.com/steveukx/git-js/commit/b0a832ce22093ff7c9d24aa2b010dd005760acf6))

## [2.42.0](https://www.github.com/steveukx/git-js/compare/v2.41.2...v2.42.0) (2021-07-31)

### Features

-  move `log` task to separate task builder ([0712f86](https://www.github.com/steveukx/git-js/commit/0712f86cf03be04c844cfda0e00fc8cbdb634bb7))
-  support `scope` argument in `listConfig` to return a specific scope's configuration ([0685a8b](https://www.github.com/steveukx/git-js/commit/0685a8b5d8558252bb50451d9c6c8b2bd474d0c8))

### [2.41.2](https://www.github.com/steveukx/git-js/compare/v2.41.1...v2.41.2) (2021-07-29)

### Bug Fixes

-  use literal `true` and `false` in `DiffResultTextFile | DiffResultBinaryFile` to aid type assertions. ([8059099](https://www.github.com/steveukx/git-js/commit/80590997b62573b5cf6483054676efaf7d379d52))

### [2.41.1](https://www.github.com/steveukx/git-js/compare/v2.41.0...v2.41.1) (2021-07-11)

### Bug Fixes

-  Commit parsing should cater for file names with square brackets ([ae81134](https://www.github.com/steveukx/git-js/commit/ae811348fd7c78bf970887fe76a76014b7f64bc1))

## [2.41.0](https://www.github.com/steveukx/git-js/compare/v2.40.0...v2.41.0) (2021-07-11)

### Features

-  allow setting the scope of `git config add` to work on the `local`, `global` or `system` configuration. ([c7164e7](https://www.github.com/steveukx/git-js/commit/c7164e77b98553a5e837da301bc63430741ec092))
-  allow setting the scope of git config add to work on the `local`, `global` or `system` configuration. ([00ada06](https://www.github.com/steveukx/git-js/commit/00ada06057c21193bfbdba917b78a6d3de4ff6c9))

## [2.40.0](https://www.github.com/steveukx/git-js/compare/v2.39.1...v2.40.0) (2021-06-12)

### Features

-  create the `spawnOptions` plugin to allow setting `uid` / `gid` owner for the spawned `git` child processes. ([cc70220](https://www.github.com/steveukx/git-js/commit/cc70220f7636372a4aacd0fb5a74ee98dee54e0d))

### [2.39.1](https://www.github.com/steveukx/git-js/compare/v2.39.0...v2.39.1) (2021-06-09)

### Bug Fixes

-  add types and tests for the documented .exec API ([#631](https://www.github.com/steveukx/git-js/issues/631)) ([c9207da](https://www.github.com/steveukx/git-js/commit/c9207da1d8196193b580c5d4fed6101e5c4d4ff8))
-  add types and tests for the documented `.exec` API ([c9207da](https://www.github.com/steveukx/git-js/commit/c9207da1d8196193b580c5d4fed6101e5c4d4ff8))
-  updates the documentation for `mergeFromTo` to more closely represent its functionality (see [#50](https://www.github.com/steveukx/git-js/issues/50) for the original requirement). ([dd2244e](https://www.github.com/steveukx/git-js/commit/dd2244e1bd84911668b0d23184afb736dc5386b8))

## [2.39.0](https://www.github.com/steveukx/git-js/compare/v2.38.1...v2.39.0) (2021-05-13)

### Features

-  `git.cwd` can now be configured to affect just the chain rather than root instance. ([4110662](https://www.github.com/steveukx/git-js/commit/411066241c014c609d18a37e128c38f2c947c6e7))

### [2.38.1](https://www.github.com/steveukx/git-js/compare/v2.38.0...v2.38.1) (2021-05-09)

### Bug Fixes

-  Export `GitPluginError` from the main package. ([2aa7e55](https://www.github.com/steveukx/git-js/commit/2aa7e55216cdf57ca905cd6c23ff6b71002450c6)), closes [#616](https://www.github.com/steveukx/git-js/issues/616)

## [2.38.0](https://www.github.com/steveukx/git-js/compare/v2.37.0...v2.38.0) (2021-04-14)

### Features

-  Support enabling / disabling `debug` logs programmatically. ([#610](https://www.github.com/steveukx/git-js/issues/610)) ([c901b9c](https://www.github.com/steveukx/git-js/commit/c901b9c9e1913ccf8d5d630396f1753d057cd851))

## [2.37.0](https://www.github.com/steveukx/git-js/compare/v2.36.2...v2.37.0) (2021-03-15)

### Features

-  `errorDetectionPlugin` to handle creating error messages when tasks fail. ([c65a419](https://www.github.com/steveukx/git-js/commit/c65a4197e36b5c6f0b2afab46668ab092620a6cc))

### [2.36.2](https://www.github.com/steveukx/git-js/compare/v2.36.1...v2.36.2) (2021-03-11)

### Bug Fixes

-  Export missing `SimpleGitProgressEvent` ([038870e](https://www.github.com/steveukx/git-js/commit/038870eb9ae35be78c1dd7fe1977ad8ba35913f2)), closes [#601](https://www.github.com/steveukx/git-js/issues/601)

### [2.36.1](https://www.github.com/steveukx/git-js/compare/v2.36.0...v2.36.1) (2021-03-06)

### Bug Fixes

-  Documentation update for `outputHandler` ([775d81e](https://www.github.com/steveukx/git-js/commit/775d81e4decac8677e879e591e519fbbb6996667))
-  Support parsing `git.branch` where branches have carriage returns in the commit detail. ([5b71012](https://www.github.com/steveukx/git-js/commit/5b710125a5afde5fc1310c5a092cc7c48930c9bb))

## [2.36.0](https://www.github.com/steveukx/git-js/compare/v2.35.2...v2.36.0) (2021-03-03)

### Features

-  Timeout Plugin ([59f3d98](https://www.github.com/steveukx/git-js/commit/59f3d98017b27c251c71758e4641a6aa055549f5))

### Bug Fixes

-  Fix broken link in `no-response` auto-generated comment ([16fe73f](https://www.github.com/steveukx/git-js/commit/16fe73f36514a827d9aa8ea6b9f33b6aa0ea575d))

### [2.35.2](https://www.github.com/steveukx/git-js/compare/v2.35.1...v2.35.2) (2021-02-23)

### Bug Fixes

-  Progress plugin should request progress events for fetch as well as other common long running tasks. ([ea68857](https://www.github.com/steveukx/git-js/commit/ea688570fb444afdaa442d69f8111fd24ef53844))
-  upgrade debug from 4.3.1 to 4.3.2 ([4b6eda8](https://www.github.com/steveukx/git-js/commit/4b6eda85277a549d408d1449284b0bc03fb93c48))
-  While use of the `ListLogSummary` type is deprecated in favour of the new `LogResult`, the alias type should also support the default generic `DefaultLogFields` to allow downstream consumers to upgrade to newer `2.x` versions without the need to specify a generic. ([508e602](https://www.github.com/steveukx/git-js/commit/508e6021716cb220fbf8fca9a57a3616d2246a51)), closes [#586](https://www.github.com/steveukx/git-js/issues/586)

### [2.35.1](https://www.github.com/steveukx/git-js/compare/v2.35.0...v2.35.1) (2021-02-19)

### Bug Fixes

-  Update documentation for configuring `SimpleGit` - `options` should be a `Partial<SimpleGitOptions>` to allow for supplying just some of its properties. ([30523df](https://www.github.com/steveukx/git-js/commit/30523dff5bcd483b8fa778ae73caaa84057faad4)), closes [#580](https://www.github.com/steveukx/git-js/issues/580)

## [2.35.0](https://www.github.com/steveukx/git-js/compare/v2.34.2...v2.35.0) (2021-02-16)

### Features

-  Progress Handler ([5508bd4](https://www.github.com/steveukx/git-js/commit/5508bd4b10c7bb5233f93446931cdaa90ffeae4f))

### [2.34.2](https://www.github.com/steveukx/git-js/compare/v2.34.1...v2.34.2) (2021-02-07)

### Bug Fixes

-  fix npm publish token definition ([fb066c3](https://www.github.com/steveukx/git-js/commit/fb066c379fcf60423348f827238521350087474d))

### [2.34.1](https://www.github.com/steveukx/git-js/compare/v2.34.0...v2.34.1) (2021-02-07)

### Bug Fixes

-  auto-release with release-please ([0ed2d96](https://www.github.com/steveukx/git-js/commit/0ed2d9695ef3ee4136df12dd59802d7faaf710a6))

## [2.34.0](https://www.github.com/steveukx/git-js/compare/v2.33.0...v2.34.0) (2021-02-06)

### Features

-  refactor `git push` to TypeScript `SimpleGitBase` interface ([e77ef1b](https://www.github.com/steveukx/git-js/commit/e77ef1b1adf89722571fca3f3547b5d8dfbc9d84))
-  refactor `git push` to TypeScript `SimpleGitBase` interface ([0691e85](https://www.github.com/steveukx/git-js/commit/0691e855124e2dc5fdb3403ada30afcd157047c4))

## [2.33.0](https://www.github.com/steveukx/git-js/compare/v2.32.0...v2.33.0) (2021-02-06)

### Features

-  automate release/changelog with release-please ([3848494](https://www.github.com/steveukx/git-js/commit/384849488ada32f18c84eea22aad7b9ceb2000b5))
-  split the `git.add` into the ts `SimpleGitApi` ([14432f9](https://www.github.com/steveukx/git-js/commit/14432f9879744cafa043c0fbeee00b37db726f81))

## 2.32.0 Per-command Configuration

-  Supports passing configuration arguments to the `git` binary (via its `-c` argument as a prefix to any other
   arguments). Eg: to supply some custom http proxy to a `git pull` command, use
   `simpleGit('/some/path', { config: ['http.proxy=someproxy'] }).pull()`
-  Add deprecation notice to `git.silent`
-  Internal Updates:
   -  switch from `run` to `runTask` in `git` core
   -  finish converting all mocks to TypeScript

## 2.31.0 Handle 'root' commit syntax

-  Adds a `root: boolean` property to the `CommitResult` interface representing whether the commit was a 'root' commit
   (which is a commit that has no parent, most commonly the first commit in a repo).

## 2.30.0 Restore compatibility with Node.js v10

-  Reinstates native support for node.js v10 by removing use of ES6 constructs

## 2.29.0 Update TypeScript response type for `git.mergeFromTo`

-  Update type definition for `git.mergeFromTo` to be the `MergeResult` returned
   when using the more generic `git.merge` method.
   Thanks to [@ofirelias](https://github.com/ofirelias) for the pull request.

## 2.28.0 Add support for `git apply` & TypeScript Integration Tests

-  Adds support for `git.applyPatch` to apply patches generated in a `git diff` to the working index,
   TypeScript consumers can make use of the `ApplyOptions` type definition to make use of strong types
   for the supported options. Thanks to [@andreterron](https://github.com/andreterron) for the pull request.

-  Integration tests converted to TypeScript to ensure type safety across all tests.

## 2.27.0 Included staged delete/modify in StatusResult staged array

-  Update the `git.status` parser to account for staged deleted/modified files and staged files with subsequent
   modifications meaning a status of:
   -  `RM old -> new` will now appear in `renamed` and `new` will also appear in `modified`
   -  `D file` will now appear in both `deleted` and `staged` where `D file` would only appear in `deleted`

## 2.26.0 Fix error when using `git.log` with callback

-  Resolves an issue whereby using `git.log` with a callback (or awaiting the promise created from the now deprecated
   `simple-git/promise` import) would fail to return the response to the caller.

## 2.25.0 TypeScript Types & Unit Tests, Commit Parsing

-  See [Legacy Node Versions](https://github.com/steveukx/git-js/blob/main/docs/LEGACY_NODE_VERSIONS.md) for details of how to use `simple-git` with `node.js`
   versions 11 and below.
-  To help keep the TypeScript definitions in line with functionality, unit tests are now written in TypeScript.
-  When using `git.commit`, the first argument must be a string or array of strings. Passing another data type has long
   been considered an error, but now a deprecation warning will be shown in the log and will be switched to an error
   in version 3.
-  Fixes an issue in `git.commit` whereby a commit that included only deleted lines would be parsed as though the
   deletions were inclusions.

## 2.24.0 Types updated

-  `pull`, `push` and `pushTags` parameter types updated to match new functionality and tests switched to TypeScript to ensure they are kept in sync

## 2.23.0 update `debug` dependency & `master` -> `main`

-  Upgrade `debug` dependency and remove use of now deprecated `debug().destroy()`
-  Renames the default source branch from `master` to `main`

## 2.22.0 add `git.hashObject` interface

-  Adds support for `git hash-object FILE` and `git hash-object -w FILE`
   with new interface `git.hashObject(...)`, with thanks to [@MiOnim](https://github.com/MiOnim)

## 2.21.0 add `string[]` to `LogOptions` type

-  Adds `string[]` to the set of types supported as options for `git.log`
-  Fix readme typos

## 2.20.1 Bug-fix: `LogOptions` type definition

-  `LogOptions` should be intersection rather than union types

## 2.19.0 - Upgrade task option filters

-  move the command/task option processing function to TypeScript

## 2.18.0 - Upgrade Clone / Mirror tasks

-  `git.clone` and `git.mirror` rewritten to fit the TypeScript tasks style.
-  resolves issue whereby `git.clone` didn't accept an object of options despite being documented as supporting.

## 2.17.0 - Add remote message parsing to `git pull`

-  `git pull` (and by extension `git merge`) adds remote message parsing to the `PullResult` type
-  Remote message parsing adds property `remoteMessages.objects` of type `RemoteMessagesObjectEnumeration` to capture the objects transferred in fetch and push.

## 2.16.0 - Upgrade Move task

-  `git.mv` rewritten to fit the TypeScript tasks style.
-  set up github actions for CI

## 2.15.0 - Task parsers automatically have access to `stdErr` as well as `stdOut`

-  adds the `TaskParser` type to describe a task's parser function and creates the `LineParser` utility to simplify line-by-line parsing of string responses.
-  renames some interfaces for consistency of naming, the original name remains as a type alias marked as `@deprecated` until version 3.x:
   -  BranchDeletionSummary > BranchSingleDeleteResult
   -  BranchDeletionBatchSummary > BranchMultiDeleteResult
   -  MergeSummary > MergeResult

## 2.14.0 - Bug fix: `git.checkoutBranch` fails to pass commands to git child process

-  resolves an issue whereby the `git.checkoutBranch` method would not pass the branch detail through to the underlying child process.

## 2.13.2 - PushResult to expose all non-empty remote messages

-  Further to `2.13.0` includes all (non-empty) `remote:` lines in the `PushResult`,
   including `remote:` lines used for other parser results (ie: `pullRequestUrl` etc).

## 2.13.1 - Add support for parsing GitLab Pull Request Url Message

-  Further to `2.13.0` adding support for parsing the reponse to `git.push`, adds support for the pull request message
   used by gitlab.

## 2.13.0 - Upgraded Pull & Merge and parser for Push

-  `.push` and `.pushTags` rewritten as v2 style tasks. The git response is now parsed and returned as a
   [PushResult](https://github.com/steveukx/git-js/blob/main/simple-git/typings/response.d.ts)

-  Pull and merge rewritten to fit the TypeScript tasks style.

-  Integration tests updated to run through jest directly without compiling from nodeunit

## 2.12.0 - Bug fix: chaining onto / async awaiting `git.tags` failed

-  resolves an issue whereby the `git.tags` method could not be chained or used as an async/promise.

## 2.11.0 - Parallel / concurrent tasks, fresh repo status parser & bug-fix in `checkoutLocalBranch`

-  until now, `simple-git` reject all pending tasks in the queue when a task has failed. From `2.11.0`, only
   tasks chained from the failing one will be rejected, other tasks can continue to be processed as normal,
   giving the developer more control over which tasks should be treated as atomic chains, and which can be
   [run in parallel](https://github.com/steveukx/git-js/blob/main/readme.md#concurrent--parallel-requests).

   To support this, and to prevent the issues seen when `git` is run concurrently in too many child processes,
   `simple-git` will limit the number of tasks running in parallel at any one time to be at most 1 from each
   chain (ie: chained tasks are still run in series) and at most 5 tasks across all chains (
   [configurable](https://github.com/steveukx/git-js/blob/main/readme.md#configuration) by passing `{maxConcurrentProcesses: x}` in the `simpleGit` constructor).

-  add support to `git.status()` for parsing the response of a repo that has no commits yet, previously
   it wouldn't determine the branch name correctly.

-  resolved a flaw introduced in `2.9.0` whereby `checkoutLocalBranch` would silently fail and not check out the branch

## 2.10.0 - trailing options in checkout, init, status, reset & bug-fix awaiting a non-task

-  `git.checkout` now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit from 'simple-git';
await simpleGit().checkout('branch-name', ['--track', 'remote/branch']);
await simpleGit().checkout(['branch-name', '--track', 'remote/branch']);
await simpleGit().checkout({ 'branch-name': null });
```

-  `git.init` now supports both object and array forms of supplying trailing options and now
   parses the response to return an [InitResult](https://github.com/steveukx/git-js/blob/main/simple-git/typings/response.d.ts);

```typescript
import simpleGit, { InitResult } from 'simple-git';
const notSharedInit: InitResult = await simpleGit().init(false, ['--shared=false']);
const notSharedBareInit: InitResult = await simpleGit().init(['--bare', '--shared=false']);
const sharedInit: InitResult = await simpleGit().init(false, {
   '--shared': 'true',
});
const sharedBareInit: InitResult = await simpleGit().init({
   '--bare': null,
   '--shared': 'false',
});
```

-  `git.status` now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit, { StatusResult } from 'simple-git';
const repoStatus: StatusResult = await simpleGit().status();
const subDirStatus: StatusResult = await simpleGit().status(['--', 'sub-dir']);
```

-  `git.reset` upgraded to the new task style and exports an enum `ResetMode` with all supported
   merge modes and now supports both object and array forms of supplying trailing options.

```typescript
import simpleGit, { ResetMode } from 'simple-git';

// git reset --hard
await simpleGit().reset(ResetMode.HARD);

// git reset --soft -- sub-dir
await simpleGit().reset(ResetMode.SOFT, ['--', 'sub-dir']);
```

-  bug-fix: it should not be possible to await the `simpleGit()` task runner, only the tasks it returns.

```typescript
expect(simpleGit().then).toBeUndefined();
expect(simpleGit().init().then).toBe(expect.any(Function));
```

## 2.9.0 - checkIsRepo, rev-parse

-  `.checkIsRepo()` updated to allow choosing the type of check to run, either by using the exported `CheckRepoActions` enum
   or the text equivalents ('bare', 'root' or 'tree'):

   -  `checkIsRepo(CheckRepoActions.BARE): Promise<boolean>` determines whether the working directory represents a bare repo.
   -  `checkIsRepo(CheckRepoActions.IS_REPO_ROOT): Promise<boolean>` determines whether the working directory is at the root of a repo.
   -  `checkIsRepo(CheckRepoActions.IN_TREE): Promise<boolean>` determines whether the working directory is a descendent of a git root.

-  `.revparse()` converted to a new style task

## 2.8.0 - Support for `default` import in TS without use of `esModuleInterop`

-  Enables support for using the default export of `simple-git` as an es module, in TypeScript it is no
   longer necessary to enable the `esModuleInterop` flag in the `tsconfig.json` to consume the default
   export.

### 2.7.2 - Bug Fix: Remove `promise.ts` source from `simple-git` published artifact

-  Closes #471, whereby the source for the promise wrapped runner would be included in the published artifact
   due to sharing the same name as the explicitly included `promise.js` in the project root.

### 2.7.1 - Bug Fix: `await git.log` having imported from root `simple-git`

-  Fixes #464, whereby using `await` on `git.log` without having supplied a callback would ignore the leading options
   object or options array.

## 2.7.0 - Output Handler and logging

-  Updated to the `outputHandler` type to add a trailing argument for the arguments passed into the child process.
-  All logging now uses the [debug](https://www.npmjs.com/package/debug) library. Enable logging by adding `simple-git`
   to the `DEBUG` environment variable. `git.silent(false)` can still be used to explicitly enable logging and is
   equivalent to calling `require('debug').enable('simple-git')`.

## 2.6.0 - Native Promises, Typed Errors, TypeScript Importing, Git.clean and Git.raw

### Native Promises

-  _TL;DR - `.then` and `.catch` can now be called on the standard `simpleGit` chain to handle the promise
   returned by the most recently added task... essentially, promises now just work the way you would expect
   them to._
-  The main export from `simple-git` no longer shows the deprecation notice for using the
   `.then` function, it now exposes the promise chain generated from the most recently run
   task, allowing the combination of chain building and ad-hoc splitting off to a new promise chain.
   -  See the [unit](https://github.com/steveukx/git-js/blob/main/simple-git/test/unit/promises.spec.js) and [integration](https://github.com/steveukx/git-js/blob/main/simple-git/test/integration/promise-from-root.spec.js) tests.
   -  See the [typescript consumer](https://github.com/steveukx/git-js/blob/main/simple-git/test/consumer/ts-default-from-root.spec.ts) test.

### TypeScript Importing

-  Promise / async interface and TypeScript types all available from the `simple-git` import rather than needing
   `simple-git/promise`, see examples in the [ReadMe](https://github.com/steveukx/git-js/blob/main/readme.md) or in the [consumer tests](https://github.com/steveukx/git-js/blob/main/simple-git/test/consumer).

### Typed Errors

-  Tasks that previously validated their usage and rejected with a `TypeError` will now reject with a
   [`TaskConfigurationError`](https://github.com/steveukx/git-js/blob/main/simple-git/src/lib/errors/task-configuration-error.ts).

-  Tasks that previously rejected with a custom object (currently only `git.merge` when the auto-merge fails)
   will now reject with a [`GitResponseError`](https://github.com/steveukx/git-js/blob/main/simple-git/src/lib/errors/git-response-error.ts) where previously it
   was a modified `Error`.

### Git Clean

-  `git.clean(...)` will now return a `CleanSummary` instead of the raw string data

### Git Raw

-  `git.raw(...)` now accepts any number of leading string arguments as an alternative to the
   single array of strings.

## 2.5.0 - Git.remote

-  all `git.remote` related functions converted to TypeScript

## 2.4.0 - Git.subModule

-  all `git.subModule` related functions converted to TypeScript

## 2.3.0 - Git.config

-  add new `git.listConfig` to get current configuration
-  `git.addConfig` supports a new `append` flag to append the value into the config rather than overwrite existing

## 2.2.0 - Git.branch

-  all `git.branch` related functions converted to TypeScript
-  add new `git.deleteLocalBranches` to delete multiple branches in one call
-  `git.deleteLocalBranches` and `git.deleteLocalBranch` now support an optional `forceDelete` flag

## 2.1.0 - Git.tag

-  `.tags`, `.addTag` and `.addAnnotatedTag` converted to TypeScript, no backward compatibility changes

## 2.0.0 - Incremental switch to TypeScript and rewritten task execution

-  If your application depended on any functions with a name starting with an `_`, the upgrade may not be seamless,
   please only use the documented public API.

-  `git.log` date format is now strict ISO by default (ie: uses the placeholder `%aI`) instead of the 1.x default of
   `%ai` for an "ISO-like" date format. To restore the old behaviour, add `strictDate = false` to the options passed to
   `git.log`.

## v1 and below

Please see the [historical changelog](https://github.com/steveukx/git-js/blob/main/docs/CHANGELOG-HISTORICAL.md);
