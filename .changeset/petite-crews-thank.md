---
"@simple-git/args-pathspec": major
"@simple-git/argv-parser": major
"simple-git": patch
---

Enhances scanning of arguments before passing on to the spawned `child_process`.

Caters for `-c` flags prefixing the `git` task (used when setting global inline config) and suffixing with either `-c`, `--config` or `--config-env`. Detects `git config` operations that write to the configuration.

