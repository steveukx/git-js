---
"simple-git": minor
---

The custom binary (the first string of the `binary` option or `git.customBinary()`) may now contain spaces
when it looks like a path to a file, for example `C:\Program Files\Git\bin\git.exe`. The value must include
a path separator and no part of the path may start or end with a space. The prefix (the optional second string)
remains limited to the existing restricted character set, as it is passed to the binary as its first argument.
