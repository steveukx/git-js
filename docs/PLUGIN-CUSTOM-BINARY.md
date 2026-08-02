## Custom Binary

The `simple-git` library relies on `git` being available on the `$PATH` when spawning the child processes
to handle each `git` command.

```typescript
simpleGit().init();
```

Is equivalent to opening a terminal prompt and typing

```shell
git init
```

### Configuring the binary for a new instance

When `git` isn't available on the `$PATH`, which can often be the case if you're running in a custom
or virtualised container, the `git` binary can be replaced using the configuration object:

```typescript
simpleGit({ binary: 'my-custom-git' });
```

For environments where you need even further customisation of the path (for example flatpak or WSL),
the `binary` configuration property can be supplied as an array of up to two strings which will become
the command and first argument of the spawned child processes:

```typescript
simpleGit({ binary: ['wsl', 'git'] }).init();
```

Is equivalent to:

```shell
wsl git init
```

### Changing the binary on an existing instance

From v3.24.0 and above, the `simpleGit.customBinary` method supports the same parameter type and can be
used to change the `binary` configuration on an existing `simple-git` instance:

```typescript
const git = await simpleGit().init();
git.customBinary('./custom/git').raw('add', '.');
```

Is equivalent to:

```shell
git init
./custom/git add .
```

### Caveats / Security

The `binary` value is never executed through a shell - it is spawned directly with Node's
default `shell: false` (the `spawnOptions` config only forwards `uid`/`gid`, so `shell` cannot
be set via user options). Any value you supply is treated as a literal command or argument, so
shell metacharacters (`; | & $ ( )`) are inert and cannot be used for command injection; a bad
path simply fails at spawn if it is wrong. There is no character allowlist to bypass, so the
previously documented restriction on the `binary` string no longer applies.

The `unsafe.allowUnsafeCustomBinary` option is **deprecated and is now a no-op**. It used to
bypass the old character allowlist, which has been removed; passing it emits a deprecation
warning and otherwise has no effect.

```typescript
// `!` is now accepted as-is (previously required the deprecated override below)
simpleGit({ binary: '!' });

// still works, but is deprecated - it only emits a warning and does not change behaviour
simpleGit({
   unsafe: {
      allowUnsafeCustomBinary: true
   },
   binary: '!'
});
```
