## Task Timeouts

To handle the case where the underlying `git` processes appear to hang, configure the
`timeout` plugin with a number of milliseconds to wait after last received content on either
`stdOut` or `stdErr` streams before sending a `SIGINT` kill message.

```typescript
import simpleGit, { GitPluginError, SimpleGit, SimpleGitProgressEvent } from 'simple-git';

const git: SimpleGit = simpleGit({
   baseDir: '/some/path', 
   timeout: {
       block: 2000,
   },
});

// if the `git pull` process fails to send content to the `stdOut` or `stdErr`
// streams for 2 seconds, simple-git will kill it with a SIGINT
try {
    await git.pull();
}
catch (err) {
    if (err instanceof GitPluginError && err.plugin === 'timeout') {
        // task failed because of a timeout
    }
}
```
