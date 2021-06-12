## Process Owner User / Group

To set the user identity or group identity of the spawned git commands to something other than the owner of
the current Node process, supply a `spawnOptions` option with a `uid`, a `gid`, or both:

```typescript
const git: SimpleGit = simpleGit('/some/path', { spawnOptions: { gid: 20 } });

// any command executed will belong to system group 20
await git.pull();
```

```typescript
const git: SimpleGit = simpleGit('/some/path', { spawnOptions: { uid: 1000 } });

// any command executed will belong to system user 1000
await git.pull();
```
