import { TestRepoSetup } from './TestRepoSetup'

beforeAll(async () => {
   if (!process.env.CI) {
      jest.setTimeout(300000)
   }
})

// Useful if the environment variables are changed during tests.
const OLD_ENV = process.env

// Clean up the mocks before each test.
beforeEach(() => {
   jest.resetModules()
   jest.clearAllMocks()

   process.env = OLD_ENV
})

afterEach(() => {
   process.env = OLD_ENV
})

afterAll(() => {
   TestRepoSetup.tearDown()
})
