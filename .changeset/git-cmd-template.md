---
"simple-git": minor
---

Add `git.cmd` for running commands written as tagged template literals, where every interpolated value is
treated as untrusted data that can't add options, set configuration keys or select a remote helper transport.
Add the `remoteUrl()` and `refName()` value wrappers for stricter validation of interpolated values.
