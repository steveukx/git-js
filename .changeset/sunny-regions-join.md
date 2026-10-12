---
"@simple-git/argv-parser": minor
"simple-git": minor
---

Vulnerability reports:

- closing the loop on any configuration setting ending with `cmd` or `command` under the catch-all `allowUnsafeCommandBinaries` setting. Thanks to @Akokonunes for identifying the `gpg.ssh.defaultKeyCommand` configuration not being caught through the `allowUnsafeGpgProgram` setting.
- `allowUnsafePager` will now catch setting a custom binary in `git grep --open-files-in-pager` with thanks to @ba-am for identifying the issue.
