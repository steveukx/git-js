import { SimpleGit } from './simple-git';

export * from './errors';
export * from './response';
export * from './simple-git';
export * from './types';

export declare function gitP(basePath?: string): SimpleGit;

export default function simpleGit(basePath?: string): SimpleGit;
