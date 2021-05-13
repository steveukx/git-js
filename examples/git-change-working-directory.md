## Changing Working Directory

To change the directory the `git` commands are run in you can either configure the `simple-git` instance
when it is created by using the `baseDir` property:

```typescript
import { join } from 'path';
import simpleGit from 'simple-git';

const git = simpleGit({ baseDir: join(__dirname, 'repos') });
```

Or explicitly set the working directory at some later time, for example after cloning a repo:

```typescript
import { join } from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

const remote = `https://github.com/steveukx/git-js.git`;
const target = join(__dirname, 'repos', 'git-js');

// repo is now a `SimpleGit` instance operating on the `target` directory
// having cloned the remote repo then switched into the cloned directory
const repo: SimpleGit = await simpleGit().clone(remote, target).cwd({ path: target });
```

In the example above we're using the command chaining feature of `simple-git` where many commands
are treated as an atomic operation. To rewrite this using separate `async/await` steps would be:

```typescript
import { join } from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

const remote = `https://github.com/steveukx/git-js.git`;
const target = join(__dirname, 'repos', 'git-js');

// create a `SimpleGit` instance 
const git: SimpleGit = simpleGit();

// use that instance to do the clone
await git.clone(remote, target);

// then set the working directory of the root instance - you want all future
// tasks run through `git` to be from the new directory, rather than just tasks
// chained off this task
await git.cwd({ path: target, root: true });
```
