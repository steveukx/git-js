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

