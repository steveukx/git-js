---
"@simple-git/argv-parser": patch
---

Vulnerability detection expanded to cover configuration delivered through path-taking global options, where
the dangerous value is a file on disk rather than a token `simple-git` can inspect:

- `--exec-path` names the directory `git` loads built-in commands and remote helpers from, and is blocked
  under the new `allowUnsafeExec` category along with the `GIT_EXEC_PATH` environment variable (previously
  grouped under `allowUnsafeConfigPaths`)
- `--git-dir`, `--work-tree` and `-C` cause `git` to read the configuration of the repository they name, and
  are blocked under `allowUnsafeConfigPaths`

These options are only detected when supplied before the git sub-command and with a value - used as getters
(`git.raw('rev-parse', '--git-dir')`) or as task options (`git.raw('commit', '-C', 'HEAD~1')`) they are
unaffected.
