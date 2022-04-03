import { TestContext } from '../create-test-context';

export type SimpleGitTestContext = TestContext & {
   git: { raw(...args: string[]): Promise<unknown> }
}
