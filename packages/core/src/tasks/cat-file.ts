import { bufferTask, stringTask } from '../task/task';
import type { BufferTask, StringTask } from '../task/task.types';

/**
 * Reads repository objects as utf-8 text — e.g. `catFile(['-p', 'HEAD:file'])`.
 */
export function catFile(args: string[] = []): StringTask<string> {
   return stringTask(['cat-file', ...args]);
}

/**
 * Reads repository objects as raw bytes, for binary blobs where a utf-8 round
 * trip would corrupt the content. Resolves a `Buffer`.
 */
export function catFileBuffer(args: string[] = []): BufferTask<Buffer> {
   return bufferTask(['cat-file', ...args]);
}
