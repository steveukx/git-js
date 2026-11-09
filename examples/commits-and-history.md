---
title: Commits and history
group: Examples
---

# Commits and history

## Committing with a specific author

Set the local configuration for the author, then override the author for an individual commit:

```typescript
await simpleGit()
   .addConfig('user.name', 'Some One')
   .addConfig('user.email', 'some@one.com')
   .commit('committed as "Some One"', 'file-one')
   .commit('committed as "Another Person"', 'file-two', {
      '--author': '"Another Person <another@person.com>"',
   });
```

## Multi-line commit messages

Supply the message as an array, `git` separates each item with a blank line:

```typescript
await git.commit(['feat: add the thing', 'A longer description of the thing.']);
```

## Reading the log

```typescript
// the full history
const { all, latest } = await git.log();

// only the commits between two tags
const range = await git.log({ from: '0.11.0', to: '0.12.0' });

// the last ten commits that changed a file
const file = await git.log({ file: 'package.json', maxCount: 10 });

// choose the fields returned for each commit
const custom = await git.log({ format: { hash: '%H', subject: '%s', author: '%an' } });
```

## Limiting a task to part of the repo

When a task doesn't explicitly limit its scope (ie: `git.add()` requires the files to be added, but `git.status()`
runs against the entire repo), add a `pathspec` to the options:

```typescript
import { simpleGit, pathspec } from 'simple-git';

const git = simpleGit();
const wholeRepoStatus = await git.status();
const subDirStatus = await git.status([pathspec('sub-dir')]);
const subDirDiff = await git.diffSummary(['HEAD~1', pathspec('sub-dir')]);
```

## Reading a file at a specific commit

```typescript
const text = await git.show('v1.0.0:package.json');

// binary content
const image = await git.showBuffer('main:images/logo.png');
```

## Undoing changes

```typescript
import { ResetMode } from 'simple-git';

// discard local changes to a single file
await git.reset(ResetMode.HARD, ['--', 'my-file.txt']);

// revert a commit
await git.revert('HEAD~1');
```
