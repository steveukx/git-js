---
"simple-git": minor
---

Use `pathspec` wrappers for remote and local paths when running either `git.clone` or `git.mirror` to
avoid leaving them less open for unexpected outcomes when passing unsanitised data into these tasks. 
