import simpleGit, { CleanOptions, SimpleGit, simpleGit as namedSimpleGit } from 'simple-git';

/*
 * Type only regression test for https://github.com/steveukx/git-js/issues/1191 - when
 * resolved through the node16 `import` condition, the default export must be the
 * callable factory rather than the module namespace.
 */
export const fromDefaultImport: SimpleGit = simpleGit();

export const fromNamedImport: SimpleGit = namedSimpleGit('./test');

export const dryRun: CleanOptions = CleanOptions.DRY_RUN;
