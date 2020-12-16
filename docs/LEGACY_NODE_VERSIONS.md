
# Legacy Node Versions

From `v3.x`, `simple-git` will drop support for `node.js` version 10 or below.

To use in lower versions of node, ensure you are also including the necessary polyfills from `core-js`:

## Example - JavaScript

```javascript
require('core-js/stable/array/flat-map');
require('core-js/stable/object/from-entries');
require('core-js/stable/object/from-entries');

const simpleGit = require('simple-git');
```   

## Example - TypeScript

```typescript
import 'core-js/stable/array/flat-map';
import 'core-js/stable/object/from-entries';
import 'core-js/stable/object/from-entries';

import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();
```   
