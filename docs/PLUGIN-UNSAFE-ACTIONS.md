## Unsafe Actions

As `simple-git` passes generated arguments through to a child process of the calling node.js process, it is recommended
that any parameter sourced from user input is validated before being passed to the `simple-git` api.

In some cases where there is an elevated potential for harm `simple-git` will throw an exception unless you have
explicitly opted in to the potentially unsafe action.

### Overriding allowed protocols

A standard installation of `git` permits `file`, `http` and `ssh` protocols for a remote. A range of 
[git remote helpers](https://git-scm.com/docs/gitremote-helpers) other than these default few can be
used by referring to te helper name in the remote protocol - for example the git file descriptor transport
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

