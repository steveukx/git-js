import { exists } from '@kwsites/file-exists';

jest.mock('@kwsites/file-exists', () => ({
   exists: jest.fn().mockReturnValue(true),
}));

export function isInvalidDirectory() {
   (exists as jest.Mock).mockReturnValue(false);
}

export function isValidDirectory() {
   (exists as jest.Mock).mockReturnValue(true);
}
