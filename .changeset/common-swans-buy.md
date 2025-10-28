---
"simple-git": minor
---

Support for absolute paths on Windows when using `git.checkIngore`, previously Windows would report
paths with duplicate separators `\\\\` between directories.

Thanks to @Maxim-Mazurok for reporting this issue.
