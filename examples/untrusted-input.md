---
title: Handling untrusted input
group: Examples
---

# Handling untrusted input

`simple-git` runs the `git` binary with arguments built by your application. Read the
[security policy](../SECURITY.md) to find out which inputs are safe for data from untrusted sources.

## Use `git.cmd` for untrusted values

Values interpolated into a `git.cmd` tagged template literal always become exactly one argument and can never add
options. Wrap values with `remoteUrl`, `refName` or `pathspec` for stricter validation:

```typescript
import { pathspec, refName, remoteUrl, simpleGit } from 'simple-git';

const git = simpleGit({ strictConfig: true });

await git.cmd`clone --depth 1 ${remoteUrl(url, { protocols: ['https'] })} ${pathspec(target)}`;
await git.cmd`checkout -b ${refName(branch)}`;
await git.cmd`commit --message=${message} -- ${files}`;
```

Values that would be read as options are rejected before `git` is run:

```typescript
const { branch } = JSON.parse(`{ "branch": "--upload-pack=touch /tmp/pwned" }`);

// rejects: the value would be read as an option
await git.cmd`fetch origin ${branch}`;
```

## Never build options from untrusted data

Options objects and arrays passed to the other tasks, such as `git.push`, are always treated as trusted. Write them
in your application and use untrusted data only to choose between them:

```typescript
// the request decides whether to force push, but never supplies the options themselves
const options = request.force ? { '--force-with-lease': null } : {};

await git.push('origin', 'main', options);
```

## Restrict configuration keys

Configuration keys outside the built-in safe list emit a warning, set `strictConfig` to reject them instead and
name any keys your application needs in `allowConfig`:

```typescript
const git = simpleGit({
   strictConfig: true,
   allowConfig: ['http.proxy'],
   config: ['http.proxy=someproxy'],
});
```

See [unsafe actions](../docs/PLUGIN-UNSAFE-ACTIONS.md) for the full set of safety checks and how to opt out of them.
