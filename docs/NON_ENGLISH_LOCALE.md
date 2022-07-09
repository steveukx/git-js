# Non-English Locales

Some `simple-git` tasks return the `stdout` of the `git` binary directly (for example `git.raw()`)
whereas some parse the `stdout` to pick out the useful data and build a structured response
(for example `git.branchLocal()` which returns a `BranchSummary`).

If your locale is set to any language other than English, please ensure you use the `LANG` and
`LC_ALL` environment variables to ensure the `simple-git` parsers match correctly:

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit().env({
   LANG: 'C',
   LC_ALL: 'C',
});
const branches = await git.branchLocal();
```

> I've set a locale environment variable and now my auth is failing

`simple-git` uses a `ChildProcess` to run the `git` commands, which will uses the same environment
variables available in the node process running your script. When the environment variables are
customised though, only those variables are available in the `git` process.

If you are relying on `GIT_*` (or any other) environment variables to make `git` function
correctly, ensure you pass those through as well:

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit().env({
   ...process.env,
   LANG: 'C',
   LC_ALL: 'C',
});
const branches = await git.branchLocal();
```

