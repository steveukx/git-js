import { execP } from '@kwsites/exec-p';

const versions = getVersions();

export const getWorkspaceVersion = async (packageName: string) => {
   const workspaceVersions = await versions;
   if (!workspaceVersions[packageName]) {
      throw new Error(`getWorkspaceVersion(): "${packageName}" not found in workspace.`);
   }
   return workspaceVersions[packageName];
};

async function getVersions(): Promise<Record<string, string>> {
   const workspaces = JSON.parse(
      await execP('pnpm', ['list', '-r', '--depth', '-1', '--json'])
   ).map(({ name, version }) => [name, version]);

   return Object.fromEntries(workspaces);
}
