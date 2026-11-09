---
title: Setting up repositories
group: Examples
---

# Setting up repositories

## Initialise a git repo if necessary

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit(__dirname);

if (!(await git.checkIsRepo())) {
   await git.init().addRemote('origin', 'https://some.git.repo');
}

await git.fetch();
```

## Starting a new repo

```typescript
await simpleGit()
   .init()
   .add('./*')
   .commit('first commit!')
   .addRemote('origin', 'https://github.com/user/repo.git')
   .push(['-u', 'origin', 'main']);
```

## Cloning a repo

```typescript
// clone into a named directory
await simpleGit().clone('https://github.com/steveukx/git-js.git', './git-js');

// shallow clone using options
await simpleGit().clone('https://github.com/steveukx/git-js.git', './git-js', ['--depth', '1']);

// mirror a repo
await simpleGit().mirror('https://github.com/steveukx/git-js.git', './git-js.git');
```

When the url or path come from an untrusted source, see [handling untrusted input](./untrusted-input.md).

## Cloning a private repo

The simplest way to supply credentials is to include them in the URL, don't enable debug logging when using this
mechanism to ensure passwords aren't logged:

```typescript
const USER = 'something';
const PASS = 'somewhere';
const REPO = 'github.com/username/private-repo';

await simpleGit().clone(`https://${USER}:${PASS}@${REPO}`);
```

## Using a custom SSH command

```typescript
const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';

await simpleGit({ allowEnvironment: ['GIT_SSH_COMMAND'] })
   .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
   .clone('git@github.com:user/repo.git');
```

## Showing progress of long-running tasks

See [progress events](../docs/PLUGIN-PROGRESS-EVENTS.md) for more details.

```typescript
const git = simpleGit({
   progress({ method, stage, progress }) {
      console.log(`git.${method} ${stage} stage ${progress}% complete`);
   },
});

await git.clone('https://github.com/user/repo.git');
```
