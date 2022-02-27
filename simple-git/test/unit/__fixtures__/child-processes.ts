import { mockChildProcessModule } from '@simple-git/test-utils';

jest.mock('child_process', () => mockChildProcessModule);

afterEach(() => mockChildProcessModule.$reset());
