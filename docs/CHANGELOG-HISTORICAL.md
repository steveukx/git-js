# Change History & Release Notes

## 1.110.0 - ListLogLine

- The default format expression used in `.log` splits ref data out of the `message` into a property of its own:  `{ message: 'Some commit message (some-branch-name)' }` becomes `{ message: 'Some commit message', refs: 'some-branch-name' }` |
- The commit body content is now included in the default format expression and can be used to identify the content of merge conflicts eg: `{ body: '# Conflicts:\n# some-file.txt' }` | 


## 1.0.0

Bumped to a new major revision in the 1.x branch, now uses `ChildProcess.spawn` in place of `ChildProcess.exec` to
add escaping to the arguments passed to each of the tasks.

