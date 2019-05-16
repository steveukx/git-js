import * as PATH from 'path';
import * as FS from 'fs';


export class IntegrationTestContext {

   public readonly root: string = FS.mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-');

   dir (path: string): string {
      const dir = PATH.join(this.root, path);
      if (!FS.existsSync(dir)) {
         FS.mkdirSync(dir);
      }

      return dir;
   }

   file (dir: string, path: string, content: string) {
      const file = PATH.join(this.dir(dir), path);
      FS.writeFileSync(file, content, 'utf8');

      return file;
   }

   thePath (p: string): PathDetail {
      const path = PATH.join(this.root, p);

      try {
         const x = FS.statSync(path);
         return {
            exists: true,
            directory: x.isDirectory(),
            file:  x.isFile(),
            path,
         };
      }
      catch (e) {
         return {
            exists: false,
            directory: false,
            file: false,
            path,
         };
      }
   }

}

export interface PathDetail {
   directory: boolean;
   file: boolean;
   exists: boolean;
   path: string;
}
