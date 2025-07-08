import { DeeplyAllowMatchers, expect } from 'vitest';

export function like<T>(what: DeeplyAllowMatchers<T>) {
   return expect.objectContaining<T>(what);
}
