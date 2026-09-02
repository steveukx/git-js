---
"simple-git": major
---

Major upgrade to v4. In this version:

- Removed previously available default export, now uses a consistently named `simpleGit` export.
- Removed previously deprecated import `simple-git/promise` (change to using the main `simple-git` import).
- Removed legacy `gitP` export (change to using the main `simpleGit` export).

```typescript
// v3 - previously supported imports
import simpleGit from 'simple-git';
import { gitP } from 'simple-git';
import simpleGit from 'simple-git/promise';
const simpleGit = require('simple-git');

// v4 - consolidates to a single supported import
import { simpleGit } from 'simple-git';
const { simpleGit } = require('simple-git');
```

- Prevents the use of abbreviated long-form `git` options:

```typescript
// v3 - allowed the use of unambiguous long-form options
git.raw('clone', '--conf=user.name=me', '...');

// v4 - requires full option names, abbreviated option names will now throw a GitConfigurationError
git.raw('fetch', '--config=user.name=me', '...');
```

- Ambient environment variables are filtered before passing into the `git` child process.

```typescript
// v3
process.env.FOO = 'bar';
process.env.GIT_TEMPLATE_DIR = './some/path';
simpleGit().raw('clone'); // git child process can see both environment variables

// v4
process.env.FOO = 'bar';
process.env.GIT_TEMPLATE_DIR = './some/path';
simpleGit().raw('clone'); // git child process now sees only FOO

simpleGit({
   // explicitly allow the named environment variable so it can pass through.   
   allowEnvoronment: ['GIT_TEMPLATE_DIR'],
   // and enable the use of an unsafe behaviour 
   unsafe: { allowUnsafeTemplateDir: true },
})
```

- Explicitly supplied disallowed environment variables will throw when used.

```typescript
// v3 used a single opt-in to potential unsafe actiity
simpleGit({ unsafe: { allowUnsafeTemplateDir: true } })
   .env({ GIT_TEMPLATE_DIR: './foo' })
   .init();

// v4 uses a double opt-in, allow the behaviour and the mechanism
simpleGit({
      allowEnvoronment: ['GIT_TEMPLATE_DIR'],
      unsafe: { allowUnsafeTemplateDir: true }
   })
   .env({ GIT_TEMPLATE_DIR: './foo' }).init();

```
