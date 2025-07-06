import { exists } from '@kwsites/file-exists';
import { Mock, vi } from 'vitest';

vi.mock('@kwsites/file-exists', () => ({
   exists: vi.fn().mockReturnValue(true),
}));

export function isInvalidDirectory() {
   debugger;
   (exists as Mock).mockReturnValue(false);
}

export function isValidDirectory() {
   debugger;
   (exists as Mock).mockReturnValue(true);
}
