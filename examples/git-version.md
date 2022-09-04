## Check if git is installed

To check if `git` (or the `customBinary` of your choosing) is accessible, use the
`git.version()` api:

```typescript
import { simpleGit } from 'simple-git';

const {installed} = await simpleGit().version();
if (!installed) {
  throw new Error(`Exit: "git" not available.`);
}

// ... continue using git commands here
```

## Check for a specific version of git

Using the `git.version()` interface, you can query for the current `git` version
information split by `major`, `minor` and `patch`:

```typescript
import { simpleGit } from 'simple-git';
import { lt } from 'semver';

const versionResult = await simpleGit().version();
if (lt(String(versionResult), '2.1.0')) {
  throw new Error(`Exit: "git" must be at least version 2.1.0.`);
}

// ... continue using git commands here compatible with 2.1.0 or higher
```
