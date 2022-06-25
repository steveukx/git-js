import { default as simpleGit, ResetMode } from 'simple-git';
import { suite } from './suite.mjs';

await suite('import default-as', simpleGit, ResetMode);
