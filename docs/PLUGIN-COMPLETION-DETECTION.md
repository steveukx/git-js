## Configure how `simple-git` determines the `git` tasks to be complete.

Up until version `2.46.0`, `simple-git` used both `close` and `exit` events from the `git` child process to determine
whether the task was complete as follows:

- the close / exit event fires
- if there is data on either `stderr` or `stdout`, or if the child process as a whole has thrown an exception (for
  example when `git` is not installed) then the task is complete.
- otherwise wait `50ms` and then treat the task as complete.

From version `2.46.0` onwards, you can configure this behaviour by using the
`completion` plugin:

```typescript
import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit({
   completion: {
      onExit: 50,
      onClose: true,
   },
});
```

The `completion` plugin accepts two properties `onClose` and `onExit` that can be either:

- `false` to ignore this event from the child process
- `true` to treat the task as complete as soon as the event has fired
- `number` to wait an arbitrary number of `ms` after the event has fired before treating the task as complete.

To ensure backward compatibility, version 2.x of `simple-git` uses a default of
`onClose = true, onExit = 50`.

From version 3.x of `simple-git` the default will change to `onClose = true, onExit = false`,
it should only be necessary to handle the `exit` event when the child processes are
configured to not close (ie: with keep-alive).
