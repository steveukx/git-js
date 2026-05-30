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
   const workspaces: Array<{ name?: string; version?: string }> = JSON.parse(
      await execP('pnpm', ['ls', '-r', '--depth', '-1', '--json'])
   );

   const versions: Record<string, string> = {};
   for (const { name, version } of workspaces) {
      if (name && version) {
         versions[name] = version;
      }
   }

   return versions;
}
