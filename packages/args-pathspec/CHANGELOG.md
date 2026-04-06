# @simple-git/args-pathspec

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
