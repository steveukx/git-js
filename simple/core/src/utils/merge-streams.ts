import { PassThrough } from 'node:stream';

export function mergeStreams(
   ...sources: Array<NodeJS.ReadableStream | null | undefined>
): NodeJS.ReadableStream {
   const merged = new PassThrough();
   let open = sources.length;
   for (const src of sources) {
      if (!src) {
         continue;
      }
      src.on('error', (err) => merged.destroy(err));
      src.pipe(merged, { end: false }); // don't let one end() the merge
      src.on('end', () => --open === 0 && merged.end());
   }
   return merged;
}
