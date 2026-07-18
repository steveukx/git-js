import { exists } from '@kwsites/file-exists';
import type { Mock } from 'vitest';

// `@kwsites/file-exists` is mocked globally in test/setup.ts - these helpers
// flip the stubbed return value for the folder-existence construct-error path.
export function isInvalidDirectory() {
   (exists as Mock).mockReturnValue(false);
}

export function isValidDirectory() {
   (exists as Mock).mockReturnValue(true);
}
