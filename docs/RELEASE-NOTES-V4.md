
# Migration Guide: V4

The move to v4 standardises how the library is loaded and initialised and reduces attack vectors by blocking the
use of abbreviated `git` options in commands. In many cases the upgrade from v3 will be seamless or have an upgrade
path outlined below:

- [Import Syntax](#import-syntax)
- [Abbreviated Options](#abbreviated-options)
- [Environment Variable Filtering](#environment-filtering)
- [Removed deprecated interfaces](#deprecated-interfaces)


### Import Syntax <a name="import-syntax"></a>

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

### Abbreviated Options <a name="abbreviated-options"></a>

- Abbreviated long-form `git` options are now blocked by default as part of reducing potential attack vectors for
  unintentional malicious code when passing unsanitised user data into a `git` task: 

```typescript
// v3 - allowed the use of unambiguous long-form options
git.raw('clone', '--conf=user.name=me', '...');

// v4 - requires full option names, abbreviated option names will now throw a GitConfigurationError
git.raw('fetch', '--config=user.name=me', '...');

// v4 - optionally allow abbreviations, this should only be enabled when task data is sanitised
simpleGit({ unsafe: { allowAbbreviatedOptions: true } })
   .raw('fetch', '--config=user.name=me', '...');
```

### Environment Variable Filtering <a name="environment-filtering"></a>

Child processes created to run the `git` tasks would previously use a full clone of the outer Node.js process which
could lead to a compromised system running arbitrary commands. `simple-git` v4 will now filter out `git` impacting
environment variables from the parent process unless explicitly opted in using the `unsafe` plugin:

```typescript
// v3
process.env.FOO = 'bar';
process.env.GIT_TEMPLATE_DIR = './some/path';
simpleGit().raw('init'); // git child process would see both environment variables

// v4
process.env.FOO = 'bar';
process.env.GIT_TEMPLATE_DIR = './some/path';
simpleGit().raw('init'); // git child process now sees only FOO

simpleGit({
   // explicitly allow the named environment variable so it can pass through.   
   allowEnvoronment: ['GIT_TEMPLATE_DIR'],
   // and enable the use of an unsafe behaviour 
   unsafe: { allowUnsafeTemplateDir: true },
})
```

Setting the child process environment variables uses the same interface as v3:

```typescript
// v3 - spread in the parent environment and override a value
simpleGit()
   .env({ ...process.env, GIT_TEMPLATE_DIR: './some/path' })
   .init()


// v4 uses a double opt-in, allow the behaviour and the mechanism
simpleGit({
      allowEnvoronment: ['GIT_TEMPLATE_DIR'],  // allow the use of the environment variable
      unsafe: { allowUnsafeTemplateDir: true } // allow the potentially unsafe behaviour
   })
   .env({ ...process.env, GIT_TEMPLATE_DIR: './foo' })
   .init();
```

### Removed deprecated interfaces <a name="deprecated-interfaces"></a>

Tidying up code paths that were marked as deprecated during the v2->v3 migration:

- `simpleGit.silent()` logging is configured through environment variables in the `debug` package
- `simpleGit.clearQueue()` this has been a noop since v3, switch to using the `abort` plugin
- Accessing parsed properties of a `GitResponseError` through a trailing callback function are available only through the `error.git` property (previously properties were also spread onto the `error` itself with a deprecation notice).

