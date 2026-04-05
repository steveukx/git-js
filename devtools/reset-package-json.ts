import simpleGit from '../simple-git';
import { repoRoot } from './repo-root';

const git = simpleGit({ baseDir: repoRoot });

git.status()
   .then((status) => {
      return status.files
         .filter((file) => file.path.endsWith('package.json'))
         .map((file) => file.path);
   })
   .then((paths) => git.raw('checkout', '--', ...paths));
