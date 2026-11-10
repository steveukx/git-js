---
"@simple-git/argv-parser": minor
"simple-git": minor
---

`HOME` and `XDG_CONFIG_HOME` supplied through `.env()` with a value other than the one in `process.env` now require `allowUnsafeConfigPaths` (or naming them in `allowEnvironment`), as `git` reads the global configuration from `$HOME/.gitconfig` and `$XDG_CONFIG_HOME/git/config` in the same way as `GIT_CONFIG_GLOBAL`. Passing the inherited value through is unaffected, and neither is removed from the inherited environment.

`parseEnv` accepts the inherited environment as an optional second argument, used to compare `HOME` and `XDG_CONFIG_HOME` against.

`isGuardedEnvKey` is now exported from `@simple-git/argv-parser`, identifying the environment variables (`GIT_*` and the others `git` reads, such as `EDITOR` and `PAGER`) that `simple-git` removes from an inherited environment.
