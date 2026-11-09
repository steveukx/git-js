---
title: Troubleshooting
group: Guides
---

# Troubleshooting / FAQ

## Enable logging

See the [debug logging guide](./DEBUG-LOGGING-GUIDE.md) for logging examples and how to use the
[debug](https://www.npmjs.com/package/debug) library's programmatic interface in your application, including the
[verbose logging options](./DEBUG-LOGGING-GUIDE.md#verbose-logging-options).

## Every command returns an ENOENT error

There are a few potential reasons:

- `git` isn't available as a binary for the user running the main `node` process, set a custom path to the
  binary with the `binary` option or `git.customBinary(...)`, see [Custom Binary](./PLUGIN-CUSTOM-BINARY.md).

- the working directory passed to the `simpleGit` function isn't accessible, check it is read/write accessible
  by the user running the `node` process. This library uses
  [@kwsites/file-exists](https://www.npmjs.com/package/@kwsites/file-exists) to validate the working directory
  exists, to output its logs add `@kwsites/file-exists` to your `DEBUG` environment variable:

  `DEBUG=@kwsites/file-exists,simple-git node ./your-app.js`

## Log format fails

The properties of `git log` are fetched using the `--pretty=format` argument which supports different tokens
depending on the version of `git` - for example the `%D` token used to show the refs was added in git `2.2.3`. For
any version before that, supply your own `format` object with properties supported by the version of git you are
using. See the [official `git log` documentation](https://git-scm.com/docs/git-log#_pretty_formats) for the
supported tokens.

## Log response properties are out of order

The properties of `git.log` are fetched using the character sequence `ò` as a delimiter. If your commit messages
use this sequence, supply a custom `splitter` in the options, for example: `git.log({ splitter: '💻' })`

## Pull / Diff / Merge summary responses don't recognise any files

- Enable verbose logs with the environment variable `DEBUG=simple-git:task:*,simple-git:output:*`
- Check the output (for example: `simple-git:output:diff:1 [stdOut] 1 file changed, 1 insertion(+)`)
- Check the `stdOut` output is the same as you would expect to see when running the command directly in a terminal
- Check the language used in the response is the english locale, see [non-english locales](./NON_ENGLISH_LOCALE.md)

In some cases `git` will show progress messages or additional detail on error states in the `stdErr` output that
will help debug your issue, these messages are also included in the verbose log.
