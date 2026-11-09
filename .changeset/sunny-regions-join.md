---
"@simple-git/argv-parser": minor
"simple-git": minor
---

Vulnerability reports:

With thanks to @Akokonunes for identifying the `gpg.ssh.defaultKeyCommand` configuration not being caught through the `allowUnsafeGpgProgram` setting, and to @ba-am for identifying that `git grep --open-files-in-pager` could set a custom pager binary.

- closing the loop on any configuration setting ending with `.cmd` or `command` under the catch-all `allowUnsafeCommandBinaries` setting, and blocking `gpg.ssh.defaultKeyCommand` under `allowUnsafeGpgProgram`.
- `allowUnsafePager` will now catch setting a custom binary in `git grep --open-files-in-pager`.
- `allowUnsafePager` now also covers `interactive.diffFilter`, the shell command that `git add -p` and the other `--patch` commands pipe their diff through.
- new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeSendEmailConfig` option covering the `sendemail.*` keys that `git send-email` runs as commands, reads as files or uses to turn off certificate verification (`sendmailCmd`, `toCmd`, `ccCmd`, `headerCmd`, `smtpServer`, `smtpServerOption`, `smtpSSLCertPath`, `smtpSSLClientCert`, `smtpSSLClientKey`, `aliasesFile` and `mailmap.file`, including their per-identity `sendemail.<identity>.*` variants).
- new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeWebServerConfig` option covering the `instaweb.httpd`, `instaweb.modulePath` and `instaweb.gitwebDir` keys used by `git instaweb`.
- new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeBrowser` option covering the `browser.<tool>.path`, `browser.<tool>.cmd`, `man.<tool>.path` and `man.<tool>.cmd` keys used by `git help` and `git instaweb` to open a browser or man page viewer. `browser.<tool>.cmd` and `man.<tool>.cmd` were previously covered by `allowUnsafeCommandBinaries`.
- new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeSignatureTrust` option covering `gpg.ssh.allowedSignersFile`, `gpg.ssh.revocationFile` and `gpg.minTrustLevel`, which decide which signatures pass verification.
