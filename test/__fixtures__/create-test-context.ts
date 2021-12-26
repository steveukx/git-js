import { join } from 'path';
import { existsSync, mkdir, mkdtemp, realpathSync, writeFile, WriteFileOptions } from 'fs';
import { SimpleGit } from '../../typings';
import { newSimpleGit } from './instance';

export interface SimpleGitTestContext {
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

   readonly git: SimpleGit;
}

const io = {
   mkdir (path: string): Promise<string> {
      return new Promise((done, fail) => {
         if (existsSync(path)) {
            return done(path);
         }

         mkdir(path, {recursive: true}, (err) => err ? fail(err) : done(path));
      });
   },
   mkdtemp (): Promise<string> {
      return new Promise((done, fail) => {
         mkdtemp((process.env.TMPDIR || '/tmp/') + 'simple-git-test-', (err, path) => {
            err ? fail(err) : done(path);
         });
      });
   },
   writeFile (path: string, content: string, encoding: WriteFileOptions = 'utf-8'): Promise<string> {
      return new Promise((done, fail) => {
         writeFile(path, content, encoding, (err) => {
            err ? fail(err) : done(path);
         })
      })
   }
}

export async function createTestContext (): Promise<SimpleGitTestContext> {

   const root = await io.mkdtemp();

   const context: SimpleGitTestContext = {
      path (...segments) {
         return join(root, ...segments);
      },
      async dir (...paths) {
         if (!paths.length) {
            return root;
         }

         return await io.mkdir(context.path(...paths));
      },
      async file (path, content = `File content ${path}`) {
         if (Array.isArray(path)) {
            await context.dir(path[0]);
         }

         const pathArray = Array.isArray(path) ? path : [path];
         return await io.writeFile(context.path(...pathArray), content);
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
      get git () {
         return newSimpleGit(root);
      },
   };

   return context;
}

