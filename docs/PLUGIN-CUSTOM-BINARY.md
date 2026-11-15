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

To prevent accidentally merging arbitrary code into the spawned child processes, the strings supplied
in the `binary` config are limited to alphanumeric, slashes, dot, hyphen, underscore and tilde. Colon is also
permitted when part of a valid windows path (ie: after one letter at the start of the string).

The binary itself (the first string) may also contain spaces when it looks like a path to a file, for example
`C:\Program Files\Git\bin\git.exe` or `/opt/my tools/git`: it must include at least one path separator, and
no part of the path may start or end with a space. Spaces are never permitted in the prefix (the second string)
as that is passed to the binary as its first argument.

This protection can be overridden by passing an additional unsafe configuration setting:

```typescript
// this would normally throw because of the invalid value for `binary` 
simpleGit({
   unsafe: {
      allowUnsafeCustomBinary: true
   },
   binary: '!'
});
```
