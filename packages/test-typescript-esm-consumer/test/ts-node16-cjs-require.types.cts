import simpleGit = require('simple-git');

/*
 * Type only regression test for https://github.com/steveukx/git-js/issues/1191 - when
 * resolved through the node16 `require` condition, `module.exports` must be described
 * as the callable factory by way of `export =`.
 */
export const fromExportEquals: simpleGit.SimpleGit = simpleGit();

export const fromNamedExport: simpleGit.SimpleGit = simpleGit.simpleGit('./test');

export const dryRun: simpleGit.CleanOptions = simpleGit.CleanOptions.DRY_RUN;
