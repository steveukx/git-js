import { GitConstructError } from './errors/git-construct-error';
import { GitError } from './errors/git-error';
import { GitPluginError } from './errors/git-plugin-error';
import { GitResponseError } from './errors/git-response-error';
import { TaskConfigurationError } from './errors/task-configuration-error';
import { CheckRepoActions } from './tasks/check-is-repo';
import { CleanOptions } from './tasks/clean';
import { ResetMode } from './tasks/reset';

const api = {
   CheckRepoActions,
   CleanOptions,
   GitConstructError,
   GitError,
   GitPluginError,
   GitResponseError,
   ResetMode,
   TaskConfigurationError,
}

export default api;
