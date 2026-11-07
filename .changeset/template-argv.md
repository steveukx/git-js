---
"@simple-git/argv-parser": minor
---

Add `templateArgv`, `isTemplateStringsArray`, `remoteUrl` and `refName` for building a `git` argv from a tagged
template literal, where every interpolated value is treated as untrusted data. `simple-git` uses these for `git.cmd`.
