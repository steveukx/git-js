## Using an AbortController to terminate tasks

The easiest way to send a `SIGKILL` to the `git` child processes created by `simple-git` is to use an `AbortController`
in the constructor options for `simpleGit`:

```typescript
import { simpleGit, GitPluginError, SimpleGit } from 'simple-git';

const controller = new AbortController();

const git: SimpleGit = simpleGit({
   baseDir: '/some/path', 
   abort: controller.signal,
});

try {
  await git.pull();
}
catch (err) {
    if (err instanceof GitPluginError && err.plugin === 'abort') {
        // task failed because `controller.abort` was called while waiting for the `git.pull`
    }
}
```

### Examples:

#### Share AbortController across many instances

Run the same operation against multiple repositories, cancel any pending operations when the first has been completed. 

```typescript
const repos = [
  '/path/to/repo-a',
  '/path/to/repo-b',
  '/path/to/repo-c',
];

const controller = new AbortController();
const result = await Promise.race(
  repos.map(baseDir => simpleGit({ baseDir, abort: controller.signal }).fetch())
);
controller.abort();
```
