import { exists } from '@kwsites/file-exists';
import { Mock, vi } from 'vitest';

vi.mock(import('@kwsites/file-exists'), async (importOriginal) => {
   const original = await importOriginal();
   return {
      ...original,
      exists: vi.fn().mockReturnValue(true),
   };
});

export function isInvalidDirectory() {
   (exists as Mock).mockReturnValue(false);
}

export function isValidDirectory() {
   (exists as Mock).mockReturnValue(true);
}
