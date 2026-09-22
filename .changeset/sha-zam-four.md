---
"@simple-git/args-pathspec": patch
"@simple-git/argv-parser": major
---

Updates ahead of the v4 release for `simple-git`.

- Adds support for TypeScript declaration maps
- Exports the `isGitEnvKey` helper to detect whether an environment variable can be used to configure a `git` operation

- Adds detection for `includeIf.<condition>.path`, thanks to @NotAFlightRisk for identifying the vulnerability
