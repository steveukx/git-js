# @simple-git/argv-parser

## 2.0.1

### Patch Changes

- 68874c2: Add `VISUAL` environment variable to set of `allowUnsafeEditor` environment variables.

  Thanks to @oss-security-shopify for identifying the vulnerability.

## 2.0.0

### Major Changes

- 98864c6: Updates ahead of the v4 release for `simple-git`.

  - Adds support for TypeScript declaration maps
  - Exports the `isGitEnvKey` helper to detect whether an environment variable can be used to configure a `git` operation

  - Adds detection for `includeIf.<condition>.path`, thanks to @bhaswanthc, @NotAFlightRisk, @oss-security-shopify for identifying the vulnerability

### Patch Changes

- c427fba: Additional argument parser vulnerability checks:

  - Thanks to @bhaswanthc, @mrillicit, @avrlab233, @avrlab233 for identifying `include.path`, `filter.*.process`
  - Thanks to @tejas619 for identifying `url.*.insteadOf`

- 1bb14df: Vulnerability detection expanded to include `pager.*`, `uploadpack.packObjectsHook`, `difftool.*.cmd` and use of the `GIT_CONFIG_PARAMETERS` environment variable

  Thanks to @threalwinky and @nuc13us for identifying.

- dfeb116: Vulnerability detection expanded to cover configuration delivered through path-taking global options, where
  the dangerous value is a file on disk rather than a token `simple-git` can inspect:

  - `--exec-path` names the directory `git` loads built-in commands and remote helpers from, and is blocked
    under the new `allowUnsafeExec` category along with the `GIT_EXEC_PATH` environment variable (previously
    grouped under `allowUnsafeConfigPaths`)
  - `--git-dir`, `--work-tree` and `-C` cause `git` to read the configuration of the repository they name, and
    are blocked under `allowUnsafeConfigPaths`

  These options are only detected when supplied before the git sub-command and with a value - used as getters
  (`git.raw('rev-parse', '--git-dir')`) or as task options (`git.raw('commit', '-C', 'HEAD~1')`) they are
  unaffected.

- d762810: Add `allowUnsafeExec` detection to `rebase -x` and `rebase --exec`.

  Thanks to @gdegrange for the vulnerability report.

- d762810: Add `allowUnsafeCommandBinaries` detection to configuring `trailer.<token>.cmd` and `trailer.<token>.command`.

  Thanks to @sec-reex for the vulnerability report.

- Updated dependencies [98864c6]
  - @simple-git/args-pathspec@1.0.4

## 1.1.1

### Patch Changes

- c38a674: Add backward compatible API, resolves issue caused by using simple-git@3.35.2 with @simple-git/argv-parser@1.1.0

## 1.1.0

### Minor Changes

- 89a2294: Extend known exploitable configuration keys and per-task environment variables.

  Note - `ParsedVulnerabilities` from `argv-parser` is removed in favour of a readonly array of `Vulnerability` to match usage in `simple-git`, rolled into the new `vulnerabilityCheck` for simpler access to the identified issues.

  Thanks to @zebbern for identifying the need to block `core.fsmonitor`.
  Thanks to @kodareef5 for identifying the need to block `GIT_CONFIG_COUNT` environment variables and `--template` / `merge` related config.

### Patch Changes

- 675570a: Update devDependencies
- Updated dependencies [675570a]
  - @simple-git/args-pathspec@1.0.3

## 1.0.3

### Patch Changes

- 0cf9d8c: Improvements for mono-repo publishing pipeline
- Updated dependencies [0cf9d8c]
  - @simple-git/args-pathspec@1.0.2

## 1.0.2

### Patch Changes

- 0de400e: Update monorepo version handling during publish

## 1.0.1

### Patch Changes

- 3d8708b: Updating publish config
- Updated dependencies [3d8708b]
  - @simple-git/args-pathspec@1.0.1

## 1.0.0

### Major Changes

- 2e1f51c: Enhances scanning of arguments before passing on to the spawned `child_process`.

  Caters for `-c` flags prefixing the `git` task (used when setting global inline config) and suffixing with either `-c`, `--config` or `--config-env`. Detects `git config` operations that write to the configuration.

### Patch Changes

- Updated dependencies [2e1f51c]
  - @simple-git/args-pathspec@1.0.0
