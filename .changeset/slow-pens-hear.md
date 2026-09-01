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

