# Security Policy

`simple-git` is a thin layer over the `git` command line. Every task runs the `git` binary
installed on the host with arguments built by your application. Read this page to find out which
arguments `simple-git` makes safe for data from untrusted sources and which ones it does not.

## Supported versions

| Version | Security fixes |
| ------- | -------------- |
| 4.x     | Yes            |
| < 4.0   | No             |

## Reporting a vulnerability

Report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/steveukx/git-js/security/advisories/new).
Please don't open a public issue for a vulnerability that's in scope (see below).

A useful report includes:

- the `simple-git` version and the `git --version` you tested with
- the smallest code sample that shows the problem, written as a `simple-git` API call
- which of the inputs to that call come from an untrusted source

`simple-git` is maintained by volunteers, so responses are best-effort. Fixed vulnerabilities
are published as GitHub security advisories and get a regression test in
[`simple-git/test/integration/advisories`](./simple-git/test/integration/advisories).

## Threat model

### When can untrusted data be used

These inputs can take data from an untrusted source, such as a user, an HTTP request, a webhook
payload or a file on disk. Within these inputs, `simple-git` makes sure the data can't add `git`
options, change configuration, choose a different sub-command or run another program:

- Values interpolated into a [`git.cmd`](./readme.md#git-cmd) tagged template literal, including
  values wrapped with `remoteUrl()`, `refName()` or `pathspec()`.
- Paths wrapped with `pathspec()` in any task.
- The `repoPath` and `localPath` arguments of `git.clone()` and `git.mirror()`, but only in the
  sense that they're always passed after `--`, so they can't be read as options. They aren't
  checked as URLs: a `repoPath` such as `codecommit::...` uses whatever remote helpers are
  installed and allowed by `git`'s `protocol.*` configuration. Use
  ``git.cmd`clone ${remoteUrl(repoPath)} ${pathspec(localPath)}` `` to restrict the protocol.

If untrusted data in one of these inputs makes `git` treat it as an option, set configuration
or run another program, that is a vulnerability. The same applies if a `git.cmd` value selects a
remote helper transport (`ext::`, `fd::`, ...). Please report it privately as described above.

### When must trusted data be used

`simple-git` passes everything else to `git` as it was written by your application.
**Never pass data from an untrusted source into any of these:**

- `git.raw()`
- options objects and option arrays (the `options` / `customArgs` argument of any task)
- arguments to typed tasks that aren't listed above, such as branch names in
  `checkout()` or file lists in `add()`. Use `git.cmd` with `refName()` or `pathspec()` for these.
- `simpleGit` instance options: `config`, `allowConfig`, `allowEnvironment`, `unsafe`, `binary`,
  `spawnOptions`, `baseDir`
- environment variables set through `.env()`, and the environment of the Node.js process
- the contents of the repository being worked on (hooks, `.git/config`, `.gitattributes`,
  `.gitmodules` and so on). `git` controls these, see
  [`safe.directory`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-safedirectory)
- the installed `git` binary and its system / global configuration

Being able to run commands by controlling one of these inputs is **not** a vulnerability in
`simple-git`. Like `child_process.spawn`, these inputs exist to control what gets executed.

If your application can't sanitise data before it reaches one of these inputs, enable strict mode
with `strictConfig: true` and leave the `unsafe` options switched off. Strict mode rejects any
configuration key that isn't in the built-in safe list or your `allowConfig` list, instead of
emitting a warning. This narrows what untrusted data can do, but the checks are
[defence in depth](#defence-in-depth), not a guarantee.

### Defence in depth

`simple-git` checks for known high-risk arguments, configuration keys and environment
variables in the trusted inputs:

- the [`allowConfig`](./docs/PLUGIN-UNSAFE-ACTIONS.md#allow-config) list, which only allows
  configuration keys known to be safe unless you name others
- the [`allowEnvironment`](./docs/PLUGIN-UNSAFE-ACTIONS.md#allow-environment) list, which removes
  `git`-related environment variables unless you name them
- the [unsafe actions](./docs/PLUGIN-UNSAFE-ACTIONS.md) checks, which block options such as
  `--upload-pack` and configuration such as `core.sshCommand` until you opt in

These checks catch mistakes, they are not a security boundary. A way around one of them is a
bug: open an issue or pull request and it will be fixed in a normal release. It does not get a
security advisory unless it also affects one of the inputs in
[When can untrusted data be used](#when-can-untrusted-data-be-used).

## Recommendations

- Turn on `strictConfig: true` so that configuration keys outside the built-in safe list and your
  `allowConfig` list are rejected rather than producing a warning. This will be the default in
  the next major version.
- Use `git.cmd` instead of `git.raw` for arbitrary commands that include untrusted data, and wrap values with
  `remoteUrl()`, `refName()` or `pathspec()` so they're validated for the role they play.
- Keep `allowConfig`, `allowEnvironment` and `unsafe` as short as you can, and name exact keys
  rather than wildcards.
- Keep `git` up to date. Many `git` vulnerabilities are fixed in `git` itself and can't be
  mitigated by `simple-git`.
- Run `git` as a user that can only access what it needs (see
  [spawn options](./docs/PLUGIN-SPAWN-OPTIONS.md)), particularly when working with repositories
  from untrusted sources.
