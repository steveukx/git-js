---
"simple-git": minor
---

Removed the character allowlist that restricted the `binary` / `customBinary` value to a narrow set of characters. The git binary is spawned directly with `shell: false`, so shell metacharacters and unusual path characters are never interpreted by a shell and cannot be used for command injection; the allowlist provided no protection and only served to reject legitimate binaries (e.g. paths containing a space such as `C:\Program Files\Git\bin\git.exe`).

The `unsafe.allowUnsafeCustomBinary` option is now deprecated and is a no-op (it previously bypassed the removed allowlist); passing it emits a deprecation warning.
