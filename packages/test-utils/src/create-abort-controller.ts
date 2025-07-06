import { setMaxListeners } from 'node:events';

export function createAbortController() {
   if (typeof AbortController === 'undefined') {
      return createMockAbortController() as { controller: AbortController; abort: AbortSignal };
   }

   const controller = new AbortController();
   setMaxListeners(1000, controller.signal);
   return {
      controller,
      abort: controller.signal,
      mocked: false,
   };
}

function createMockAbortController(): unknown {
   let aborted = false;
   const handlers: Set<() => void> = new Set();
   const abort = {
      addEventListener(type: 'abort', handler: () => void) {
         if (type !== 'abort') throw new Error('Unsupported event name');
         handlers.add(handler);
      },
      removeEventListener(type: 'abort', handler: () => void) {
         if (type !== 'abort') throw new Error('Unsupported event name');
         handlers.delete(handler);
      },
      get aborted() {
         return aborted;
      },
   };

   return {
      controller: {
         abort() {
            if (aborted) throw new Error('abort called when already aborted');
            aborted = true;
            handlers.forEach((h) => h());
         },
      },
      abort,
      mocked: true,
   };
}
