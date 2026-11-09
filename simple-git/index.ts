/**
 * A lightweight interface for running `git` commands in any node.js application.
 *
 * @packageDocumentation
 * @mergeModuleWith <project>
 */

export { pathspec } from '@simple-git/args-pathspec';

export * from './src/lib/api';
export { simpleGit } from './src/lib/git-factory';
export type * from './src/typings';
