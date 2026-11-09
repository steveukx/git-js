---
title: Remotes and syncing
group: Examples
---

# Remotes and syncing

## Pull and restart the app when there are changes

```typescript
import { exec } from 'node:child_process';
import { simpleGit } from 'simple-git';

const git = simpleGit();

console.log('Starting pull...');
const update = await git.pull();
if (update.summary.changes) {
   exec('npm restart');
}
console.log('pull done.');
```

Or as a chain, using `exec` to run functions between tasks:

```typescript
await simpleGit()
   .exec(() => console.log('Starting pull...'))
   .pull()
   .exec(() => console.log('pull done.'));
```

## Update the repo and get the latest tag

```typescript
const { latest } = await simpleGit(__dirname + '/some-repo')
   .pull()
   .tags();

console.log('Latest available tag: %s', latest);
```

## Push with `-u`

```typescript
await simpleGit()
   .add('./*')
   .commit('first commit!')
   .addRemote('origin', 'some-repo-url')
   .push(['-u', 'origin', 'main']);
```

## Listing remotes

```typescript
// named remotes, with their fetch and push urls
const remotes = await git.getRemotes(true);

// the url of the default remote
const url = await git.listRemote(['--get-url']);

// the branches and tags on the remote
const refs = await git.listRemote(['--heads', '--tags']);
```

## Passing options to the remote command

```typescript
// results in 'git pull origin main --no-rebase'
await git.pull('origin', 'main', { '--no-rebase': null });

// results in 'git push origin main --force-with-lease'
await git.push('origin', 'main', ['--force-with-lease']);
```
