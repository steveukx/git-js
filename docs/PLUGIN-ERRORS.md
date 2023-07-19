## Custom Error Detection

By default, `simple-git` will determine that a `git` task has resulted in an error when the process exit
code is anything other than `0` and there has been some data sent to the `stdErr` stream. Error handlers
will be passed the content of both `stdOut` and `stdErr` concatenated together.

To change any of this behaviour, configure the `simple-git` with the `errors` plugin with a function to be
called after every task has been run and should return either `undefined` when the task is treated as
a success, or a `Buffer` or `Error` when the task should be treated as a failure.

When the default error handler (or any other plugin) has thrown an error, the first argument to the error
detection plugin is the original error. Either return that error directly to allow it to bubble up to the
task's error handlers, or implement your own error detection as below:

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit({
   errors(error, result) {
      // optionally pass through any errors reported before this plugin runs
      if (error) return error;

      // customise the `errorCode` values to treat as success
      if (result.exitCode === 0) {
         return;
      }

      // the default error messages include both stdOut and stdErr, but that
      // can be changed here, or completely replaced with some other content
      return Buffer.concat([...result.stdOut, ...result.stdErr]);
   }
})
```
