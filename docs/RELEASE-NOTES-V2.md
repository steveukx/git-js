
# simple-git release 2.x

Released on [28 April 2020](https://github.com/steveukx/git-js/tree/v2.0.0)

Major release 2.x changes the way the queue of tasks are handled to use promises internally and makes
available the `.then` and `.catch` methods for integrating with promise consumers or async await.

TypeScript is used by default for all new code, allowing for auto-generated type definitions and a phased
re-write of the library rather than a big-bang.

For a per-release overview of changes, see the [changelog](https://github.com/steveukx/git-js/blob/main/simple-git/CHANGELOG.md).

## 2.x Upgrade Notes

When upgrading to release 2.x from 1.x, see the [changelog](https://github.com/steveukx/git-js/blob/main/simple-git/CHANGELOG.md) for the release 2.0.0

# Altered APIs

- ~~2.25.0 depends on Node.js version 12 or above, for use in lower versions of node.js ensure you are also
  importing the necessary polyfills from `core-js`, see [Legacy Node Versions](https://github.com/steveukx/git-js/blob/main/docs/LEGACY_NODE_VERSIONS.md)~~
  _this change has been reverted in 2.30.0 and will be postponed until version 3.x_.

- 2.13.0 `.push` now returns a [PushResult](https://github.com/steveukx/git-js/blob/main/simple-git/typings/response.d.ts) parsed representation of the response.

- 2.11.0 treats tasks chained together as atomic, where any failure in the chain prevents later tasks from
  executing and tasks called from the root `git` instance as the origin of a new chain, and able to be
  [run in parallel](#concurrent--parallel-requests) without failures impacting one anther. Prior to this
  version, tasks called on the root `git` instance would be cancelled when another one failed.

- 2.7.0 deprecates use of `.silent()` in favour of using the `debug` library - see the
  [debug logging guide](https://github.com/steveukx/git-js/blob/main/docs/DEBUG-LOGGING-GUIDE.md) for further details.

- 2.6.0 introduced `.then` and `.catch` as a way to chain a promise onto the current step of the chain.
  Importing from `simple-git/promise` instead of just `simple-git` is no longer required and is actively discouraged.

For the full history see the [changelog](https://github.com/steveukx/git-js/blob/main/simple-git/CHANGELOG.md);  

