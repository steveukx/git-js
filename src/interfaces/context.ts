import { Readable } from 'stream';

export interface Context {
   baseDir: string;
   command: string;
   env: any;
   outputHandler?: (command: string, stdout: Readable | null, stderr: Readable | null) => void;

   exec: (args: Array<string | number>) => Promise<string>;
}
