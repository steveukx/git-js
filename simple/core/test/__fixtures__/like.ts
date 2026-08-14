import { expect } from 'vitest';

export function like<T>(what: Partial<T>): T {
   return expect.objectContaining(what as unknown);
}
