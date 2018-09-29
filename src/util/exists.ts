import fs from 'fs';

function stat(path: string, isFile: boolean, isDirectory: boolean) {
   try {
      const stat = fs.statSync(path);

      let matches = false;

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

function bool(input: number) {
   return input !== 0;
}

export function exists(path: string, type: number) {
   if (!type) {
      return stat(path, true, true);
   }

   return stat(path, bool(type & 1), bool(type & 2));
}

export const FILE = 1;

export const FOLDER = 2;
