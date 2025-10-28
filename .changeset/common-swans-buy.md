---
"simple-git": minor
---

Support for absolute paths on Windows when using `git.checkIngore`, previously Windows would report
paths with duplicate separators `\\\\` between directories.

Following this change all paths returned from `git.checkIgnore` will be normalized through `node:path`,
this should have no impact on non-windows users where the `git` binary doesn't wrap absolute paths with
quotes.

Thanks to @Maxim-Mazurok for reporting this issue.
