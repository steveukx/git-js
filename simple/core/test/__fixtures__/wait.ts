export function wait(timeout = 10): Promise<void> {
   return new Promise((ok) => setTimeout(ok, timeout));
}
