---
"@simple-git/argv-parser": minor
"simple-git": minor
---

Add the `unsafe.recommended` option, enabling the checks that use broader catch-all rules (such as any configuration
key ending in `.cmd` or `command` under `allowUnsafeCommandBinaries`). Defaults to `false`, and is implied by
`strictConfig: true`. It will default to `true` in the next major version.

Each `Vulnerability` reported by `@simple-git/argv-parser` now carries a `level` of `default` for explicitly
identified risks, or `recommended` for those caught by a catch-all rule. The `VulnerabilityLevel` type is exported.
