
export interface Deferred<T = any, E = Error> {
   promise: Promise<T>;
   resolve: (fulfillment: T) => void;
   reject: (err: E) => void;
}

export function deferred<T = any, E = Error> (): Deferred<T, E> {
   let resolve: (fulfillment: T) => void, reject: (err: E) => void;

   const promise = new Promise((ok: (fulfillment: T) => void, fail: (err: E) => void) => {
      resolve = ok;
      reject = fail;
   });

   return {
      promise,
      resolve: (arg: T) => resolve(arg),
      reject: (arg: E) => reject(arg),
   };
}
