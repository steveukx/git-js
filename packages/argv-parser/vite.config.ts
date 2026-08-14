import { simpleGitTesting } from '@simple-git/test-config';
import { mergeConfig } from 'vite';

import { baseConfig } from '../../devtools/vite-config';

export default mergeConfig(baseConfig('args-pathspec'), simpleGitTesting());
