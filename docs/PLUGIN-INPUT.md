## Sending content to `stdin`

Some `git` commands read their input from the `stdin` stream rather than from a file or the command line
arguments (for example `git interpret-trailers`, `git hash-object --stdin` or `git mktree`). To supply that
content, configure the `input` plugin with a function that returns the content to write to `stdin` of the
spawned `git` child process:

```typescript
import { simpleGit, type SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit({
   baseDir: '/some/path',
   trimmed: true,
   input() {
      return `
Makes some fixes.

Signed-off-by: Steve King <steve@example.com>
Issue: #123
`;
   },
});

// the commit message returned by `input` is sent to `stdin` of the `git interpret-trailers` process
const trailers = await git.raw('interpret-trailers', '--parse');
```

The function can return either a `string` or a `Buffer`. Once the content has been written, the `stdin` stream
is closed so `git` knows there is no more input to read.

## Choosing when to send content

The `input` function is called for every `git` process spawned by the `simple-git` instance, and receives the
array of arguments being passed to `git` for that process. Return `undefined` (or an empty string) to skip
writing to `stdin` for that command:

```typescript
import { simpleGit, type SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit({
   input(commands) {
      if (commands.includes('hash-object')) {
         return 'content to be stored as a blob';
      }
   },
});

// `input` supplies the content for the `hash-object` command
const hash = await git.raw('hash-object', '-w', '--stdin');

// `input` returns `undefined` for the `status` command, so nothing is written to `stdin`
const status = await git.status();
```

Note that the `input` function is synchronous, any content needed should be prepared before running the task.
If `git` exits before consuming all of the supplied content the remaining input is discarded.
