
# Debug Logging

This library uses [debug](https://www.npmjs.com/package/debug) to handle logging,
to enable logging, use either the environment variable:

```
"DEBUG=simple-git" node ./your-app.js 
``` 

Or explicitly enable logging using the `debug` library itself:

```javascript
const debug = require('debug');
const simpleGit = require('simple-git');

debug.enable('simple-git,simple-git:*');
simpleGit().init().then(() => console.log('DONE'));
``` 


```typescript
import debug from 'debug';
import simpleGit from 'simple-git';

debug.enable('simple-git,simple-git:*');
simpleGit().init().then(() => console.log('DONE'));
``` 

## Verbose Logging Options

If the regular logs aren't sufficient to find the source of your issue, enable one or more of the
following for a more complete look at what the library is doing:

- `DEBUG=simple-git` the least verbose logging, used as a high-level overview of what the library is doing
- `DEBUG=simple-git:task:*` adds debug output for each task being run through the library
- `DEBUG=simple-git:task:add:*` adds debug output for specific git commands, just replace the `add` with
  the command you need to investigate. To output multiple just add them both to the environment
  variable eg: `DEBUG=simple-git:task:add:*,simple-git:task:commit:*`
- `DEBUG=simple-git:output:*` logs the raw data received from the git process on both `stdOut` and `stdErr`
- `DEBUG=simple-git,simple-git:*` logs _everything_ 

## Problems enabling logs programmatically 

The programmatic method of enabling / disabling logs through the `debug` library should 'just work',
but you may have issues when there are multiple versions of `debug` available in the dependency tree.
The simplest way to resolve that is to use a `resolutions` override in the `package.json`.

For example this `package.json` depends on an old version of `simple-git` but instead of allowing
`simple-git` to use its own old version of `debug`, `npm` would use version `4.3.1` throughout.

```json
{
   "name": "my-app",
   "dependencies": {
      "simple-git": "^2.21.0",
      "debug": "^4.3.1"
   },
   "resolutions": {
      "debug": "^4.3.1"
   }
}
```
