/**
 * Registers the unit test module mocks before any spec is imported
 * to allow for use of `vi.doMock` in the mock files as part of the
 * unit test project setup
 */
import '../__fixtures__/debug';
import '../__fixtures__/file-exists';
import './mock-child-process';
