## Progress Events

To receive progress updates, pass a `progress` configuration option to the `simpleGit` instance:

```typescript
import simpleGit, { SimpleGit, SimpleGitProgressEvent } from 'simple-git';

const progress = ({method, stage, progress}: SimpleGitProgressEvent) => {
   console.log(`git.${method} ${stage} stage ${progress}% complete`);
}
const git: SimpleGit = simpleGit({baseDir: '/some/path', progress});

// pull automatically triggers progress events when the progress plugin is configured
await git.pull();

// supply the `--progress` option to any other command that supports it to receive
// progress events into your handler
await git.raw('pull', '--progress');
```

The `checkout`, `clone`, 'fetch, `pull`, `push` methods will automatically enable progress events
when a progress handler has been set. For any other method that _can_ support progress events,
set `--progress` in the task's `TaskOptions` for example to receive progress events when running
submodule tasks:

```typescript
await git.submoduleUpdate('submodule-name', { '--progress': null });
await git.submoduleUpdate('submodule-name', ['--progress']);
```
