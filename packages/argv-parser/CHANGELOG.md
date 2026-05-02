# @simple-git/argv-parser

## 1.1.2

### Patch Changes

- 1bb14df: Vulnerability detection expanded to include `pager.*`, `uploadpack.packObjectsHook`, `difftool.*.cmd` and use of the `GIT_CONFIG_PARAMETERS` environment variable

  Thanks to @threalwinky and @nuc13us for identifying.

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
