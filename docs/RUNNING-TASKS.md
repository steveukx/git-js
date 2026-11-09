---
title: Running Tasks
group: Guides
---

# Running Tasks

## Promises and chaining

Each task returns the `simple-git` instance for chaining together multiple tasks, and each step in the chain is
also a `Promise` that can be `await`ed or returned in a `Promise` chain:

```typescript
const git = simpleGit();

// chain together tasks to await the final result
await git.init().addRemote('origin', '...remote.git');

// or await each step individually
await git.init();
await git.addRemote('origin', '...remote.git');
```

Tasks also accept a node-style callback as their last argument:

```typescript
git.status((err, status) => {
   if (!err) console.log(status.files);
});
```

## Task responses

Tasks resolve with either the raw `string` (or `Buffer`) output of the `git` binary or, where possible, a parsed
interpretation of the response - for example `git.status()` resolves with a `StatusResult`. The
[API reference](https://steveukx.github.io/git-js/interfaces/SimpleGit.html) lists the response type of every task.

## Options

Most tasks accept trailing options as either an array of strings or an options object, see
[`TaskOptions`](https://steveukx.github.io/git-js/types/TaskOptions.html) for how they are converted into
command arguments. When there is no task for the command you need, use `git.raw` with an array of arguments, or
`git.cmd` when the command includes untrusted data.

## Handling errors

When the `git` process exits with a non-zero status (or in some cases, like `merge`, the process exits successfully
but there are conflicts) the task rejects with a `GitError`, or a `GitResponseError` when a parser was able to
interpret the response. The parsed content is available as the `git` property of a `GitResponseError`:

```typescript
import { simpleGit, GitResponseError, MergeResult } from 'simple-git';

try {
   const merge = await simpleGit().merge(['feature']);
   console.log(`Merged ${merge.merges.length} files`);
} catch (err) {
   // err.message - the string summary of the error
   // err.git - where a parser was able to run, this is the parsed content
   const merge = (err as GitResponseError<MergeResult>).git;
   console.error(`Merge resulted in ${merge?.conflicts.length ?? 0} conflicts`);
}
```

Or using `.catch` on the promise:

```typescript
const merge = await git.merge(['feature']).catch((err) => {
   if (err.git) {
      return err.git; // the unsuccessful MergeResult
   }
   throw err; // some other error, so throw
});

if (merge.failed) {
   console.error(`Merge resulted in ${merge.conflicts.length} conflicts`);
}
```

When any step in a chain fails, all pending steps in that chain are cancelled. Wrap the whole chain in a
`try/catch`, or catch individual steps to let the chain carry on:

```typescript
try {
   await git.init().catch(ignoreError);
   await git.addRemote(name, repoUrl);
} catch (e) {
   /* handle all errors here */
}

function ignoreError() {}
```

## Concurrent / parallel requests

Tasks chained together run in series, any error prevents later steps from being attempted:

```typescript
await simpleGit().init().addRemote('origin', 'https://some-repo.git').fetch();
```

Tasks called on the root instance (ie: `git = simpleGit()`) rather than chained off another task start a new chain,
so are not affected by failures in tasks already being run. Use this when the tasks are independent of each other:

```typescript
const git = simpleGit();
const results = await Promise.all([
   git.raw('rev-parse', '--show-cdup').catch(() => null),
   git.raw('rev-parse', '--show-prefix').catch(() => null),
]);
```

Each instance limits the number of child processes that can be run simultaneously and queues pending tasks for
you, configure the limit with the `maxConcurrentProcesses` option:

```typescript
const git = simpleGit({ maxConcurrentProcesses: 10 });
```
