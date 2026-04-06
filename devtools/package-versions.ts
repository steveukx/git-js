import { execP } from '@kwsites/exec-p';
import { repoRoot } from './repo-root';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

const versions = getVersions();

export const getWorkspaceVersion = async (packageName: string) => {
   const workspaceVersions = await versions;
   if (!workspaceVersions[packageName]) {
      throw new Error(`getWorkspaceVersion(): "${packageName}" not found in workspace.`);
   }
   return workspaceVersions[packageName];
};

async function getVersions(): Promise<Record<string, string>> {
   const workspaces = (await execP('yarn', ['workspaces', 'list', '--json']))
      .split('\n')
      .map((line) => {
         try {
            return (line && JSON.parse(line)) || null;
         } catch (e) {
            console.error(`getVersions(): error: `, e);
            return null;
         }
      })
      .filter(Boolean)
      .map(({ name, location }) => [name, resolve(repoRoot, location, 'package.json')]);

   const versions: Record<string, string> = {};
   for (const [name, location] of workspaces) {
      versions[name] = await getVersion(location);
   }

   return versions;
}

async function getVersion(path: string) {
   console.log(`getVersion( ${path} )`);
   return String(JSON.parse(await readFile(path, 'utf8')).version);
}
