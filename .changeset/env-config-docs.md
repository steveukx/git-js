---
"simple-git": patch
---

Correct the environment-based configuration example in the unsafe actions documentation: the `GIT_CONFIG_*`
variables must be named in `allowEnvironment`, and keys outside the built-in safe list in `allowConfig`.
