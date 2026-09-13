---
"simple-git": patch
---

No longer prints a `console.warn` for restricted characters in a custom binary when the `unsafe.allowUnsafeCustomBinary` option is set. Supplying the option is the acknowledgement, so construction is now silent. Restricted characters without the option continue to throw as before.
