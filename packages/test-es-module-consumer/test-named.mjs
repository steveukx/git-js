import { simpleGit, ResetMode } from 'simple-git';
import { suite } from './suite.mjs';

await suite('import named', simpleGit, ResetMode);
