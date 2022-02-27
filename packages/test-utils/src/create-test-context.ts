import { join } from 'path';
import { realpathSync } from 'fs';
import { createDirectory, createFile, createTempDirectory } from './lib/io';

export interface TestContext {
   /** Creates a directory under the repo root at the given path(s) */
   dir (...segments: string[]): Promise<string>;

   /** Creates a file at the given path under the repo root with the supplied content */
   file (path: string | [string, string], content?: string): Promise<string>;

   /** Creates many files at the given paths, each with file content based on their name */
   files (...paths: Array<string | [string, string]>): Promise<void>;

   /** Generates the path to a location within the root directory */
   path (...segments: string[]): string;

   /** Root directory for the test context */
   readonly root: string;

   /** Fully qualified resolved path, accounts for any symlinks to the temp directory */
   readonly rootResolvedPath: string;
}

export async function createTestContext (): Promise<TestContext> {

   const root = await createTempDirectory();

   const context: TestContext = {
      path (...segments) {
         return join(root, ...segments);
      },
      async dir (...paths) {
         if (!paths.length) {
            return root;
         }

         return await createDirectory(context.path(...paths));
      },
      async file (path, content = `File content ${path}`) {
         if (Array.isArray(path)) {
            await context.dir(path[0]);
         }

         const pathArray = Array.isArray(path) ? path : [path];
         return await createFile(context.path(...pathArray), content);
      },
      async files(...paths) {
         for (const path of paths) {
            await context.file(path);
         }
      },
      get root () {
         return root;
      },
      get rootResolvedPath () {
         return realpathSync(context.root);
      },
   };

   return context;
}

