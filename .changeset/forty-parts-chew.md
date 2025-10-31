---
"simple-git": minor
---

Correctly identify current branch name when using `git.status` in a cloned empty repo.

Previously `git.status` would report the current branch name as `No`. Thank you to @MaddyGuthridge for identifying this issue.
