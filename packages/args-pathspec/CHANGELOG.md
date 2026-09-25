# @simple-git/args-pathspec

## 1.0.4

### Patch Changes

- 98864c6: Updates ahead of the v4 release for `simple-git`.

  - Adds support for TypeScript declaration maps
  - Exports the `isGitEnvKey` helper to detect whether an environment variable can be used to configure a `git` operation

  - Adds detection for `includeIf.<condition>.path`, thanks to @NotAFlightRisk for identifying the vulnerability

## 1.0.3

### Patch Changes

- 675570a: Update devDependencies

## 1.0.2

### Patch Changes

- 0cf9d8c: Improvements for mono-repo publishing pipeline

## 1.0.1

### Patch Changes

- 3d8708b: Updating publish config

## 1.0.0

### Major Changes

- 2e1f51c: Enhances scanning of arguments before passing on to the spawned `child_process`.

  Caters for `-c` flags prefixing the `git` task (used when setting global inline config) and suffixing with either `-c`, `--config` or `--config-env`. Detects `git config` operations that write to the configuration.
