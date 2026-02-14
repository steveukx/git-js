---
"simple-git": minor
---

Removes redundant uniqueness checks throughout the `git.status` parser, each file appears
only once in the output from `git`.

Thanks to @nathanael-ruf for contributing this change.
