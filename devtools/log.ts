export function logger(name: string) {
   return (...args: unknown[]) => {
      console.log(`${name}:`, ...args);
   };
}
