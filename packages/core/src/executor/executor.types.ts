import type { Readable } from 'node:stream';

export interface SimpleGitOptions {
   /** Working directory git runs in. */
   baseDir: string;
   /** Binary used to spawn git (defaults to `git`). */
   binary: string;
   /** Caller-supplied `-c key=value` config applied to every command. */
   config: string[];
   /** Guarded environment variables permitted to reach git (deny-by-default). */
   allowEnvironment: readonly string[];
   /** Git config keys (wildcards allowed) the caller may write (deny-by-default). */
   allowConfigWrite: readonly string[];
}

export type OutputHandler = (
   command: string,
   stdout: Readable,
   stderr: Readable,
   args: string[]
) => void;

export interface SpawnResult {
   stdOut: Buffer[];
   stdErr: Buffer[];
   exitCode: number;
   rejection?: Error;
}
