---
"simple-git": patch
---

Support `env` in the `simpleGit` builder options - supply environment variables for the spawned `git` child processes when the instance is created, using the same interface as `.env()`. Previously the `env` property was silently ignored (see #1189). Guarded keys supplied this way reject the tasks they are used with unless named in `allowEnvironment`, matching the `.env()` behaviour.
