import { Mock, vi } from 'vitest';

vi.doMock(import('@kwsites/file-exists'), async (importOriginal) => {
   const original = await importOriginal();
   return {
      ...original,
      exists: vi.fn().mockReturnValue(true),
   };
});

export async function isInvalidDirectory() {
   const exists = (await import('@kwsites/file-exists')).exists as Mock;

   exists.mockReturnValue(false);
}

export async function isValidDirectory() {
   const exists = (await import('@kwsites/file-exists')).exists as Mock;

   (exists as Mock).mockReturnValue(true);
}
