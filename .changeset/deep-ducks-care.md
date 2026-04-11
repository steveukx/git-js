---
"@simple-git/argv-parser": minor
simple-git: minor
---

Extend known exploitable configuration keys and per-task environment variables.

Note - `ParsedVulnerabilities` from `argv-parser` is removed in favour of a readonly array of `Vulnerability` to match usage in `simple-git`, rolled into the new `vulnerabilityCheck` for simpler access to the identified issues. 

Thanks to @zebbern for identifying the need to block `core.fsmonitor`.
Thanks to @kodareef5 for identifying the need to block `GIT_CONFIG_COUNT` environment variables and  `--template` / `merge` related config. 
