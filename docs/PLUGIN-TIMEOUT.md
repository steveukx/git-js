## Task Timeouts

To handle the case where the underlying `git` processes appear to hang, configure the
`timeout` plugin with a number of milliseconds to wait after last received content on either
`stdOut` or `stdErr` streams before sending a `SIGINT` kill message.

```typescript
import { simpleGit, GitPluginError, SimpleGit, SimpleGitProgressEvent } from 'simple-git';

const git: SimpleGit = simpleGit({
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

## Task Timeouts and Progress Events

The default behaviour of the timeout plugin is to listen for data being received on both the
`stdOut` and `stdErr` streams from the `git` child process.

When using the `progress` plugin, `git` will be streaming regular progress updates to `stdErr`,
so you may see that the timeout is never reached and `simple-git` patiently waits for `git` to
finish whatever it is doing.

Configure this with the optional `stdOut` and `stdErr` properties of the `timeout` plugin
configuration:

```typescript
import { simpleGit, SimpleGit } from "simple-git";

const git: SimpleGit = simpleGit({
   progress({method, stage, progress}) {
      console.log(`git.${method} ${stage} stage ${progress}% complete`);
   },
   timeout: {
      block: 2000,
      stdOut: true, // default behaviour, resets the 2s timer every time data arrives on stdOut
      stdErr: false // custom behaviour, ignore the progress events being written to stdErr
   }
});

```

## Absolute or Block Timeouts

The timeout plugin will reset its timers whenever data is received meaning the plugin will
only kill processes that appear to be hanging and allow intentionally long-running processes
to continue uninterrupted.

To change this default behaviour so that the plugin kills all processes after the supplied
timeout, configure it so the plugin doesn't listen for data updates by supplying the optional
`stdOut` and `stdErr` properties of the `timeout` plugin configuration:

```typescript
import { simpleGit, SimpleGit } from "simple-git";

// create a simple-git instance that kills any process after 5s
// whether it's still receiving data or not:
const git: SimpleGit = simpleGit({
   timeout: {
      block: 5000,
      stdOut: false,
      stdErr: false
   }
});
```
