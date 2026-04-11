---
"@simple-git/argv-parser": minor
simple-git: minor
---

Extend known exploitable configuration keys and per-task environment variables.

Note - `ParsedVulnerabilities` from `argv-parser` is removed in favour of a readonly array of `Vulnerability` to match usage in `simple-git`, rolled into the new `vulnerabilityCheck` for simpler access to the identified issues. 
