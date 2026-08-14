---
"@simple-git/args-pathspec": major
"@simple-git/argv-parser": major
"simple-git": major
---

## Security
- Writing to `git` config is now blocked by default with explicit opt-in
- The `git` child process filters out potential `git` impacting environment variables by default without explicit opt-in

## Plugins

- backward compatible for existing plugins
- new plugin to add `outputHandler` as a configurable plugin, replaces the v3 `outputHandler` method on the `simpleGit` instance.

## Streaming

- The new `simpleGit().stream( ... )` method returns an async iterable of response chunks, no more buffering large files in memory before returning

## Chaining

- The new `simpleGit().run( ... )` method returns a promise of only the final supplied task for a more obvious chaining with a single async catch. Ideal for commands that inherently need to be run in series. 

## Tasks

- Methods are still available on the `simpleGit` instance (eg: `simpleGit().add(...)`) but now also available as separate functions `simpleGit().run( add(...) )`.

## Internal

- Build and test tooling updates - vite and vitest
- Dropped deprecated import `simple-git/promise`
