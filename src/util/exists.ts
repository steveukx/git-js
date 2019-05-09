import * as fs from 'fs';

function checkFS (path: string, isFile: boolean, isDirectory: boolean): boolean {
   try {
      let matches = false;
      const stat = fs.statSync(path);

      matches = matches || isFile && stat.isFile();
      matches = matches || isDirectory && stat.isDirectory();

      return matches;
   }
   catch (e) {
      if (e.code === 'ENOENT') {
         return false;
      }

      throw e;
   }
}

export function exists (path: string, type: number): boolean {
   if (!type) {
      return checkFS(path, true, true);
   }

   return checkFS(path, !!(type & FILE), !!(type & FOLDER));
}

export const FILE = 1;

export const FOLDER = 2;
