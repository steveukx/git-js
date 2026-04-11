## Unsafe Actions

As `simple-git` passes generated arguments directly to a `git` child process, **all parameters sourced from
user input must be validated and sanitised** before being passed to any `simple-git` API, regardless of which
command is being called. There is no command that is inherently safe to call with unsanitised user data.

In cases where there is a heightened potential for harm — where a single unsanitised argument could allow
arbitrary command execution or the disclosure of sensitive credentials — `simple-git` will additionally throw
a `GitPluginError` unless you have explicitly opted in to the potentially unsafe behaviour.

These blocks are a safety net, not a substitute for input validation. They cover known high-risk patterns,
but they do not protect against every possible injection or misuse of the `git` command line.

### Custom upload and receive packs

Instead of using the default `git-receive-pack` and `git-upload-pack` binaries to parse incoming and outgoing
data, `git` can be configured to use _any_ arbitrary binary or evaluable script. This applies whether the
binary is set via the `--upload-pack` / `--receive-pack` flags or through per-remote configuration
(`remote.<name>.uploadpack` / `remote.<name>.receivepack`).

```typescript
import { simpleGit } from 'simple-git';

// throws — via flag
await simpleGit()
   .raw('push', '--receive-pack=git-receive-pack-custom');

// throws — via per-remote configuration
await simpleGit()
   .raw('-c', 'remote.origin.uploadpack=/custom/upload-pack', 'fetch');

// opt in to using custom pack binaries
await simpleGit({ unsafe: { allowUnsafePack: true } })
   .raw('push', '--receive-pack=git-receive-pack-custom');
```

### Overriding allowed protocols

A standard installation of `git` permits `file`, `http` and `ssh` protocols for a remote. A range of
[git remote helpers](https://git-scm.com/docs/gitremote-helpers) other than these default few can be
used by referring to the helper name in the remote protocol - for example the git file descriptor transport
[git-remote-fd](https://git-scm.com/docs/git-remote-fd) would be used in a remote protocol such as:

```
git fetch "fd::<infd>[,<outfd>][/<anything>]"
```

To avoid accidentally triggering a helper transport by passing through unsanitised user input to a function
that expects a remote, the use of `-c protocol.fd.allow=always` (or any variant of protocol permission changes)
will cause `simple-git` to throw unless it has been configured with:

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('clone', 'ext::git-server-alias foo %G/repo', '-c', 'protocol.ext.allow=always');

// allows calling clone with a helper transport
await simpleGit({ unsafe: { allowUnsafeProtocolOverride: true } })
   .raw('clone', 'ext::git-server-alias foo %G/repo', '-c', 'protocol.ext.allow=always');
```

> *Be advised* helper transports can be used to call arbitrary binaries on the host machine.
> Do not allow them in applications where you are not in control of the input parameters.

### Command aliases

Git allows defining shorthand aliases for any command or external shell script via `alias.*` configuration.
Passing an unsanitised value as an alias target could cause `git` to execute an arbitrary command.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('-c', 'alias.ls=!ls -la', 'ls');

// opt in to defining aliases
await simpleGit({ unsafe: { allowUnsafeAlias: true } })
   .raw('-c', 'alias.ls=!ls -la', 'ls');
```

### Credential helpers

Git credential helpers are external binaries or scripts that store and retrieve authentication credentials.
An attacker-controlled `credential.helper` value could direct `git` to run an arbitrary binary with access
to any credentials passed through.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('-c', 'credential.helper=/path/to/malicious-script', 'clone', '--', 'https://example.com/repo');

// opt in to using a custom credential helper
await simpleGit({ unsafe: { allowUnsafeCredentialHelper: true } })
   .raw('-c', 'credential.helper=/path/to/custom-helper', 'clone', '--', 'https://example.com/repo');
```

### Ask-pass programs

The `core.askPass` configuration and the `GIT_ASKPASS` / `SSH_ASKPASS` environment variables define an
external binary that `git` will call to prompt for passwords. Controlling this value allows an attacker to
intercept credentials by substituting their own binary.

```typescript
import { simpleGit } from 'simple-git';

// throws — via config flag
await simpleGit()
   .raw('-c', 'core.askPass=/path/to/capture-credentials', 'clone', '--', 'https://example.com/repo');

// throws — via environment variable
await simpleGit()
   .env('GIT_ASKPASS', '/path/to/capture-credentials')
   .clone('https://example.com/repo');

// opt in to setting a custom ask-pass program
await simpleGit({ unsafe: { allowUnsafeAskPass: true } })
   .raw('-c', 'core.askPass=/usr/lib/git-core/git-gui--askpass', 'clone', '--', 'https://example.com/repo');
```

### SSH command

The `core.sshCommand` configuration and the `GIT_SSH` / `GIT_SSH_COMMAND` environment variables define the
binary used by `git` when making SSH connections. An attacker-controlled value could substitute an arbitrary
binary for the SSH transport.

```typescript
import { simpleGit } from 'simple-git';

// throws — via config flag
await simpleGit()
   .raw('-c', 'core.sshCommand=malicious-binary', 'clone', 'git@example.com:repo.git');

// throws — via environment variable
await simpleGit()
   .env('GIT_SSH_COMMAND', 'malicious-binary')
   .clone('git@example.com:repo.git');

// opt in to using a custom SSH binary
await simpleGit({ unsafe: { allowUnsafeSshCommand: true } })
   .env('GIT_SSH_COMMAND', 'ssh -i ~/.ssh/deploy_key')
   .clone('git@example.com:repo.git');
```

### Git proxy command

The `core.gitProxy` configuration and `GIT_PROXY_COMMAND` environment variable define a command to be
executed as a proxy for the `git://` transport. Passing an attacker-controlled value here can result in
arbitrary command execution on each remote operation.

```typescript
import { simpleGit } from 'simple-git';

// throws — via config flag
await simpleGit()
   .raw('-c', 'core.gitProxy=malicious-binary', 'fetch');

// throws — via environment variable
await simpleGit()
   .env('GIT_PROXY_COMMAND', 'malicious-binary')
   .fetch();

// opt in to using a custom git proxy
await simpleGit({ unsafe: { allowUnsafeGitProxy: true } })
   .env('GIT_PROXY_COMMAND', 'socks5proxywrapper')
   .fetch();
```

### Text editor

The `core.editor` and `sequence.editor` configurations and the `EDITOR` / `GIT_EDITOR` / `GIT_SEQUENCE_EDITOR`
environment variables define the text editor binary that `git` will open for interactive operations.
`core.editor` is used for commit messages and similar prompts; `sequence.editor` and `GIT_SEQUENCE_EDITOR`
are used specifically for the interactive rebase todo list. A malicious value in any of these can substitute
an arbitrary binary.

```typescript
import { simpleGit } from 'simple-git';

// throws — general editor via config
await simpleGit()
   .raw('-c', 'core.editor=malicious-binary', 'commit', '--amend');

// throws — rebase sequence editor via config
await simpleGit()
   .raw('-c', 'sequence.editor=malicious-binary', 'rebase', '-i', 'HEAD~3');

// throws — via environment variable
await simpleGit()
   .env('GIT_SEQUENCE_EDITOR', 'malicious-binary')
   .raw('rebase', '-i', 'HEAD~3');

// opt in to using a custom editor
await simpleGit({ unsafe: { allowUnsafeEditor: true } })
   .env('GIT_EDITOR', '/usr/bin/nano')
   .raw('commit', '--amend');
```

### Pager

The `core.pager` configuration and the `GIT_PAGER` / `PAGER` environment variables control the binary used
to page output from `git` commands. Substituting a malicious binary here provides an execution path that
runs for any paged output.

```typescript
import { simpleGit } from 'simple-git';

// throws — via config flag
await simpleGit()
   .raw('-c', 'core.pager=malicious-binary', 'log');

// throws — via environment variable
await simpleGit()
   .env('GIT_PAGER', 'malicious-binary')
   .log();

// opt in to using a custom pager
await simpleGit({ unsafe: { allowUnsafePager: true } })
   .env('GIT_PAGER', 'less -R')
   .log();
```

### Hooks path

The `core.hooksPath` configuration redirects `git` to load its event hooks from a location other than the
default `.git/hooks` directory. Controlling this path allows an attacker to cause arbitrary scripts to be
run automatically on standard git operations such as `commit` and `merge`.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('-c', 'core.hooksPath=/attacker/controlled/hooks', 'commit', '-m', 'message');

// opt in to using a custom hooks path
await simpleGit({ unsafe: { allowUnsafeHooksPath: true } })
   .raw('-c', 'core.hooksPath=/custom/shared/hooks', 'commit', '-m', 'message');
```

### Template directory

The `init.templateDir` configuration, `--template` flag, and `GIT_TEMPLATE_DIR` environment variable
define a directory whose contents are copied into a newly initialised `.git` directory. An attacker-controlled
template directory can plant hooks or configuration into every repository initialised by the process.

```typescript
import { simpleGit } from 'simple-git';

// throws — via config flag
await simpleGit()
   .raw('-c', 'init.templateDir=/attacker/controlled/template', 'init', 'new-repo');

// throws — via flag
await simpleGit()
   .raw('init', '--template=/attacker/controlled/template', 'new-repo');

// throws — via environment variable
await simpleGit()
   .env('GIT_TEMPLATE_DIR', '/attacker/controlled/template')
   .init('new-repo');

// opt in to using a custom template directory
await simpleGit({ unsafe: { allowUnsafeTemplateDir: true } })
   .raw('init', '--template=/custom/template', 'new-repo');
```

### External diff tool

The `diff.external` configuration, per-driver `diff.<driver>.command`, and `GIT_EXTERNAL_DIFF` environment
variable define an external binary that `git` calls to generate diffs. Substituting an attacker-controlled
binary gives it read access to every file involved in a diff operation.

```typescript
import { simpleGit } from 'simple-git';

// throws — global external diff via config
await simpleGit()
   .raw('-c', 'diff.external=malicious-diff-tool', 'diff');

// throws — per-driver diff command via config
await simpleGit()
   .raw('-c', 'diff.pdf.command=malicious-diff-tool', 'diff', 'document.pdf');

// throws — via environment variable
await simpleGit()
   .env('GIT_EXTERNAL_DIFF', 'malicious-diff-tool')
   .diff();

// opt in to using a custom diff tool
await simpleGit({ unsafe: { allowUnsafeDiffExternal: true } })
   .env('GIT_EXTERNAL_DIFF', '/usr/local/bin/my-diff-tool')
   .diff();
```

### Diff text conversion

The `diff.textconv` configuration (set per driver via `diff.<driver>.textconv`) defines a binary that converts
file content to text before generating a diff. This binary is called automatically whenever git diffs a file
with a matching driver and has read access to the file's content.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('-c', 'diff.pdf.textconv=malicious-converter', 'diff', 'document.pdf');

// opt in to using a custom text converter
await simpleGit({ unsafe: { allowUnsafeDiffTextConv: true } })
   .raw('-c', 'diff.pdf.textconv=pdftotext', 'diff', 'document.pdf');
```

### Filter operations

The `filter.<driver>.clean` and `filter.<driver>.smudge` configuration values define binaries that transform
file content when checking out (`smudge`) and staging (`clean`). Controlling either value allows an attacker
to read or modify every file that passes through the filter.

```typescript
import { simpleGit } from 'simple-git';

// throws — clean filter
await simpleGit()
   .raw('-c', 'filter.lfs.clean=malicious-binary', 'add', '.');

// throws — smudge filter
await simpleGit()
   .raw('-c', 'filter.lfs.smudge=malicious-binary', 'checkout', 'main');

// opt in to using custom filter binaries
await simpleGit({ unsafe: { allowUnsafeFilter: true } })
   .raw('-c', 'filter.lfs.clean=git-lfs clean -- %f', '-c', 'filter.lfs.smudge=git-lfs smudge -- %f', 'checkout', 'main');
```

### File system monitor

The `core.fsmonitor` configuration specifies an external binary that `git` uses to track file system changes.
This binary is invoked automatically in the background during many common operations, making it a persistent
execution path if an attacker can control the value.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .raw('-c', 'core.fsmonitor=malicious-monitor', 'status');

// opt in to using a custom file system monitor
await simpleGit({ unsafe: { allowUnsafeFsMonitor: true } })
   .raw('-c', 'core.fsmonitor=true', 'status');
```

### GPG signing program

The `gpg.program` configuration defines the binary used to sign commits and tags. Per-format variants
`gpg.ssh.program` and `gpg.x509.program` select the signing binary for SSH and X.509 signatures
respectively. All three are matched by a single block on `gpg.*.program`. Controlling any of these values
allows an attacker to run an arbitrary binary whenever a signed commit or tag is created.

```typescript
import { simpleGit } from 'simple-git';

// throws — default GPG program
await simpleGit()
   .raw('-c', 'gpg.program=malicious-binary', 'commit', '-S', '-m', 'signed commit');

// throws — SSH signing program
await simpleGit()
   .raw('-c', 'gpg.ssh.program=malicious-binary', 'commit', '-S', '-m', 'signed commit');

// opt in to using a custom GPG binary
await simpleGit({ unsafe: { allowUnsafeGpgProgram: true } })
   .raw('-c', 'gpg.program=/usr/local/bin/gpg2', 'commit', '-S', '-m', 'signed commit');
```

### Merge drivers

The `merge.driver`, `mergetool.cmd`, and `mergetool.path` configurations define external binaries used to
resolve merge conflicts. Controlling any of these values allows an attacker to run arbitrary code whenever
a merge conflict occurs.

```typescript
import { simpleGit } from 'simple-git';

// throws — custom merge driver
await simpleGit()
   .raw('-c', 'merge.union.driver=malicious-merger %O %A %B', 'merge', 'feature-branch');

// throws — merge tool command
await simpleGit()
   .raw('-c', 'mergetool.custom.cmd=malicious-binary $MERGED', 'mergetool');

// opt in to using custom merge drivers
await simpleGit({ unsafe: { allowUnsafeMergeDriver: true } })
   .raw('-c', 'mergetool.vimdiff.path=/usr/bin/vim', 'mergetool');
```

### Configuration paths via environment variables

The `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `GIT_CONFIG`, `GIT_EXEC_PATH`, and `PREFIX` environment
variables override the paths `git` uses to locate its configuration files and built-in commands. Controlling
these paths allows an attacker to supply an entirely malicious git configuration or replace git's built-in
commands with arbitrary binaries.

```typescript
import { simpleGit } from 'simple-git';

// throws
await simpleGit()
   .env('GIT_CONFIG_GLOBAL', '/attacker/controlled/gitconfig')
   .clone('https://example.com/repo');

// opt in to overriding git configuration paths
await simpleGit({ unsafe: { allowUnsafeConfigPaths: true } })
   .env('GIT_CONFIG_GLOBAL', '/custom/global/gitconfig')
   .clone('https://example.com/repo');
```

### Environment-based configuration

Git supports injecting configuration values at runtime through a set of numbered environment variables:
`GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_n`, and `GIT_CONFIG_VALUE_n`. When `GIT_CONFIG_COUNT` is set to `N`,
git reads `N` key/value pairs from the corresponding environment variables and treats them as the highest
priority configuration. Because this mechanism can set any configuration value, the injected keys are
subject to the same block-listing checks as values passed via `-c` flags.

```typescript
import { simpleGit } from 'simple-git';

// throws — GIT_CONFIG_COUNT triggers the check; the injected key is also evaluated
await simpleGit()
   .env({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.hooksPath',
      GIT_CONFIG_VALUE_0: '/attacker/hooks',
   })
   .commit('message');

// opt in to using environment-based configuration injection
await simpleGit({ unsafe: { allowUnsafeConfigEnvCount: true } })
   .env({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'user.email',
      GIT_CONFIG_VALUE_0: 'ci-bot@example.com',
   })
   .commit('CI build commit');
```
