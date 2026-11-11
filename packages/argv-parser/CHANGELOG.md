# @simple-git/argv-parser

## 3.0.0

### Major Changes

- df13aeb: Remove the `vulnerabilityCheck` export, use `parseArgv(...tokens).vulnerabilities` and `parseEnv(env).vulnerabilities`
  instead. Each vulnerability now also carries the `configKey` or `envKey` that triggered it.

### Minor Changes

- df13aeb: Add the `allowConfig` and `strictConfig` options. Configuration keys outside the built-in list of known-safe keys
  (`SAFE_CONFIG_KEYS`) and the keys named in `allowConfig` now emit a one-off `SIMPLE_GIT_UNLISTED_CONFIG` warning,
  or are rejected when `strictConfig: true` is set. Known-unsafe keys can now be permitted individually through
  `allowConfig`, and environment variables through `allowEnvironment`, deprecating the `unsafe.allowUnsafe*` options
  that only covered configuration keys or environment variables (they continue to work as before).
- a996f0f: Thanks to @manus-pi and @eliteaja11-dev for submitting CVE proposals that contributed to these changes.

  `HOME` and `XDG_CONFIG_HOME` supplied through `.env()` with a value other than the one in `process.env` now require `allowUnsafeConfigPaths` (or naming them in `allowEnvironment`), as `git` reads the global configuration from `$HOME/.gitconfig` and `$XDG_CONFIG_HOME/git/config` in the same way as `GIT_CONFIG_GLOBAL`. Passing the inherited value through is unaffected, and neither is removed from the inherited environment.

  `parseEnv` accepts the inherited environment as an optional second argument, used to compare `HOME` and `XDG_CONFIG_HOME` against.

  `isGuardedEnvKey` is now exported from `@simple-git/argv-parser`, identifying the environment variables (`GIT_*` and the others `git` reads, such as `EDITOR` and `PAGER`) that `simple-git` removes from an inherited environment.

- c8ee6bb: Vulnerability reports:

  With thanks to @manus-pi, @manus-use, @ba-am, @mspiq, @hoseinenddev, @freyesperales, @dalberrt,
  @zer0d4y5, @gamster01, @humaneBicycle, @Hama1cco, @eliteaja11-dev, @Cone-Tester, @Figo5, @MalwareEZ,
  @zachariah-mithani, @shaswata56, @Akokonunes for submitting CVE proposals that contributed to these changes.

  - closing the loop on any configuration setting ending with `.cmd` or `command` under the catch-all `allowUnsafeCommandBinaries` setting, and blocking `gpg.ssh.defaultKeyCommand` under `allowUnsafeGpgProgram`.
  - `allowUnsafePager` will now catch setting a custom binary in `git grep --open-files-in-pager`.
  - `allowUnsafePager` now also covers `interactive.diffFilter`, the shell command that `git add -p` and the other `--patch` commands pipe their diff through.
  - new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeSendEmailConfig` option covering the `sendemail.*` keys that `git send-email` runs as commands, reads as files or uses to turn off certificate verification (`sendmailCmd`, `toCmd`, `ccCmd`, `headerCmd`, `smtpServer`, `smtpServerOption`, `smtpSSLCertPath`, `smtpSSLClientCert`, `smtpSSLClientKey`, `aliasesFile` and `mailmap.file`, including their per-identity `sendemail.<identity>.*` variants), and the `imap.tunnel`, `imap.host` and `imap.sslVerify` keys used by `git imap-send`.
  - new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeWebServerConfig` option covering the `instaweb.httpd`, `instaweb.modulePath` and `instaweb.gitwebDir` keys used by `git instaweb`.
  - new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeBrowser` option covering the `browser.<tool>.path`, `browser.<tool>.cmd`, `man.<tool>.path` and `man.<tool>.cmd` keys used by `git help` and `git instaweb` to open a browser or man page viewer. `browser.<tool>.cmd` and `man.<tool>.cmd` were previously covered by `allowUnsafeCommandBinaries`.
  - new (deprecated on arrival, prefer `allowConfig`) `allowUnsafeSignatureTrust` option covering `gpg.ssh.allowedSignersFile`, `gpg.ssh.revocationFile` and `gpg.minTrustLevel`, which decide which signatures pass verification.
  - `allowUnsafePack` now blocks `--exec` for every command other than `rebase`, as it names the remote program for `push`, `send-pack`, `fetch-pack`, `archive --remote` and `ls-remote` (previously only `push`).
  - new `allowUnsafeConfigRename` option blocking `git config --rename-section` / `git config rename-section`, which could move keys written under a harmless section name (eg: `foo.fsmonitor`) into one that runs commands (`core.fsmonitor`).
  - `allowUnsafeExec` now also covers the `git filter-branch` options that run a shell command: `--setup`, `--env-filter`, `--tree-filter`, `--index-filter`, `--parent-filter`, `--msg-filter`, `--commit-filter` and `--tag-name-filter`.
  - `allowUnsafeDiffExternal` now also covers `difftool.<tool>.path`, matching `mergetool.<tool>.path` under `allowUnsafeMergeDriver`.

- df13aeb: Add `templateArgv`, `isTemplateStringsArray`, `remoteUrl` and `refName` for building a `git` argv from a tagged
  template literal, where every interpolated value is treated as untrusted data. `simple-git` uses these for `git.cmd`.

## 2.0.1

### Patch Changes

- 68874c2: Add `VISUAL` environment variable to set of `allowUnsafeEditor` environment variables.

  Thanks to @oss-security-shopify for identifying the vulnerability.

## 2.0.0

### Major Changes

- 98864c6: Updates ahead of the v4 release for `simple-git`.

  - Adds support for TypeScript declaration maps
  - Exports the `isGitEnvKey` helper to detect whether an environment variable can be used to configure a `git` operation

  - Adds detection for `includeIf.<condition>.path`, thanks to @bhaswanthc, @NotAFlightRisk, @oss-security-shopify for identifying the vulnerability

### Patch Changes

- c427fba: Additional argument parser vulnerability checks:

  - Thanks to @bhaswanthc, @mrillicit, @avrlab233, @avrlab233 for identifying `include.path`, `filter.*.process`
  - Thanks to @tejas619 for identifying `url.*.insteadOf`

- 1bb14df: Vulnerability detection expanded to include `pager.*`, `uploadpack.packObjectsHook`, `difftool.*.cmd` and use of the `GIT_CONFIG_PARAMETERS` environment variable

  Thanks to @threalwinky and @nuc13us for identifying.

- dfeb116: Vulnerability detection expanded to cover configuration delivered through path-taking global options, where
  the dangerous value is a file on disk rather than a token `simple-git` can inspect:

  - `--exec-path` names the directory `git` loads built-in commands and remote helpers from, and is blocked
    under the new `allowUnsafeExec` category along with the `GIT_EXEC_PATH` environment variable (previously
    grouped under `allowUnsafeConfigPaths`)
  - `--git-dir`, `--work-tree` and `-C` cause `git` to read the configuration of the repository they name, and
    are blocked under `allowUnsafeConfigPaths`

  These options are only detected when supplied before the git sub-command and with a value - used as getters
  (`git.raw('rev-parse', '--git-dir')`) or as task options (`git.raw('commit', '-C', 'HEAD~1')`) they are
  unaffected.

- d762810: Add `allowUnsafeExec` detection to `rebase -x` and `rebase --exec`.

  Thanks to @gdegrange for the vulnerability report.

- d762810: Add `allowUnsafeCommandBinaries` detection to configuring `trailer.<token>.cmd` and `trailer.<token>.command`.

  Thanks to @sec-reex for the vulnerability report.

- Updated dependencies [98864c6]
  - @simple-git/args-pathspec@1.0.4

## 1.1.1

### Patch Changes

- c38a674: Add backward compatible API, resolves issue caused by using simple-git@3.35.2 with @simple-git/argv-parser@1.1.0

## 1.1.0

### Minor Changes

- 89a2294: Extend known exploitable configuration keys and per-task environment variables.

  Note - `ParsedVulnerabilities` from `argv-parser` is removed in favour of a readonly array of `Vulnerability` to match usage in `simple-git`, rolled into the new `vulnerabilityCheck` for simpler access to the identified issues.

  Thanks to @zebbern for identifying the need to block `core.fsmonitor`.
  Thanks to @kodareef5 for identifying the need to block `GIT_CONFIG_COUNT` environment variables and `--template` / `merge` related config.

### Patch Changes

- 675570a: Update devDependencies
- Updated dependencies [675570a]
  - @simple-git/args-pathspec@1.0.3

## 1.0.3

### Patch Changes

- 0cf9d8c: Improvements for mono-repo publishing pipeline
- Updated dependencies [0cf9d8c]
  - @simple-git/args-pathspec@1.0.2

## 1.0.2

### Patch Changes

- 0de400e: Update monorepo version handling during publish

## 1.0.1

### Patch Changes

- 3d8708b: Updating publish config
- Updated dependencies [3d8708b]
  - @simple-git/args-pathspec@1.0.1

## 1.0.0

### Major Changes

- 2e1f51c: Enhances scanning of arguments before passing on to the spawned `child_process`.

  Caters for `-c` flags prefixing the `git` task (used when setting global inline config) and suffixing with either `-c`, `--config` or `--config-env`. Detects `git config` operations that write to the configuration.

### Patch Changes

- Updated dependencies [2e1f51c]
  - @simple-git/args-pathspec@1.0.0
