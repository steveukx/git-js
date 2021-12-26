
export function like<T> (what: Partial<T>) {
   return expect.objectContaining(what);
}
