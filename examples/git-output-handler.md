## Output Handler

As `simple-git` receives data on either `stdout` or `stderr` streams from the `git`
child processes it spawns, the data is buffered for parsing when the process has
completed.

Add an `outputHandler` to the instance to pipe these streams to another target, for
example piping to the main process `stdout` / `stderr`:

```typescript
import { InitResult, SimpleGit, simpleGit } from "simple-git";

const git: SimpleGit = simpleGit()
   .outputHandler((_command, stdout, stderr) => {
      stdout.pipe(process.stdout);
      stderr.pipe(process.stderr);
   });

const init: InitResult = await git.init();
```

Note: there is a single `outputHandler` per `simple-git` instance, calling the method again
will overwrite the existing `outputHandler`.

Other uses for the `outputHandler` can include tracking the processes for metrics purposes,
such as checking how many commands are currently being executed:

```typescript
let processes = new Set();
const currentlyRunning = () => processes.size;
const git = context.git.outputHandler((_command, stdout, stderr) => {
   const start = new Date();
   const onClose = () => processes.delete(start);

   stdout.on('close', onClose);
   stderr.on('close', onClose);

   processes.add(start);
});

expect(currentlyRunning()).toBe(0);
const queue = [git.init(), git.add('*.txt')];

await wait(0);
expect(currentlyRunning()).toBe(2);

await Promise.all(queue);
expect(currentlyRunning()).toBe(0);
```
