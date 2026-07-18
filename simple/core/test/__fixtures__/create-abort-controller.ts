import { setMaxListeners } from 'node:events';

export function createAbortController() {
   const controller = new AbortController();
   setMaxListeners(1000, controller.signal);
   return {
      controller,
      abort: controller.signal,
      mocked: false,
   };
}
