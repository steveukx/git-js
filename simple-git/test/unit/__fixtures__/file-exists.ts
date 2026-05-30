import type { Mock } from 'vitest';
import { exists } from '@kwsites/file-exists';

export function isInvalidDirectory() {
   (exists as Mock).mockReturnValue(false);
}

export function isValidDirectory() {
   (exists as Mock).mockReturnValue(true);
}
