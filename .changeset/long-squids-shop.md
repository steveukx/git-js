---
"simple-git": minor
---

Show full commit hash in a `CommitResult`, prior to this change `git.commit` resulted in a partial hash in the `commit` property, following this change the `commit` property contains a full hash.
