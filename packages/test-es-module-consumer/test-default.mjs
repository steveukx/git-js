import simpleGit, { ResetMode } from 'simple-git';
import { suite } from './suite.mjs';

await suite('import default', simpleGit, ResetMode);
