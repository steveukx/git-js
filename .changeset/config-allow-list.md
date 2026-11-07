---
"@simple-git/argv-parser": minor
"simple-git": minor
---

Add the `allowConfig` and `strictConfig` options. Configuration keys outside the built-in list of known-safe keys
(`SAFE_CONFIG_KEYS`) and the keys named in `allowConfig` now emit a one-off `SIMPLE_GIT_UNLISTED_CONFIG` warning,
or are rejected when `strictConfig: true` is set. Known-unsafe keys can now be permitted individually through
`allowConfig`, and environment variables through `allowEnvironment`, deprecating the `unsafe.allowUnsafe*` options
that only covered configuration keys or environment variables (they continue to work as before).
