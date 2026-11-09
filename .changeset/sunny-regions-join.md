---
"@simple-git/argv-parser": minor
"simple-git": minor
---

Vulnerability reports:

- closing the loop on any configuration setting ending with `.cmd` or `command` under the catch-all `allowUnsafeCommandBinaries` setting. Thanks to @Akokonunes for identifying the `gpg.ssh.defaultKeyCommand` configuration not being caught through the `allowUnsafeGpgProgram` setting.
- `allowUnsafePager` will now catch setting a custom binary in `git grep --open-files-in-pager` with thanks to @ba-am for identifying the issue.
- new `allowUnsafeSendEmailConfig` option covering the `sendemail.*` keys that `git send-email` runs as commands, reads as files or uses to turn off certificate verification (`sendmailCmd`, `toCmd`, `ccCmd`, `headerCmd`, `smtpServer`, `smtpServerOption`, `smtpSSLCertPath`, `smtpSSLClientCert`, `smtpSSLClientKey`, `aliasesFile` and `mailmap.file`, including their per-identity `sendemail.<identity>.*` variants).
- new `allowUnsafeWebServerConfig` option covering the `instaweb.httpd`, `instaweb.modulePath` and `instaweb.gitwebDir` keys used by `git instaweb`.
