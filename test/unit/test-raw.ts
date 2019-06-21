import { TestRepoSetup } from '../TestRepoSetup'

console.error = jest.fn() // Suppress pointless Git error messages

//#region  Generic test methods, for all Git command test files. Sadly can't be inherited.
const genericMethodName = 'raw'
let commitHashes: string[]

beforeAll(async () => {
   await TestRepoSetup.initialise(genericMethodName)

   return (commitHashes = await TestRepoSetup.createTestCommits())
})

describe('generic tests', () => {
   it('rejects a silly argument', async () => {
      try {
         await TestRepoSetup.repo[genericMethodName](['gibber'])
         fail('Should not get to this point')
      } catch (error) {
         expect(error.message).toMatch(/git: 'gibber' is not a git command/)
      }
   })

   it('rejects a silly array of arguments', async () => {
      try {
         await TestRepoSetup.repo[genericMethodName](['abc', 'def'])
         fail('Should not get to this point')
      } catch (error) {
         expect(error.message).toMatch(/git: 'abc' is not a git command/)
      }
   })
})
//#endregion

describe('raw()', () => {
   it('rejects empty options', async () => {
      try {
         await TestRepoSetup.repo.raw([])
         fail('Should not get to this point')
      } catch (error) {
         expect(error.message).toMatch(/Error: Raw: must supply one or more command to execute.*/)
      }
   })

   it('rejects a mostly silly array of arguments', async () => {
      try {
         await TestRepoSetup.repo.raw(['log', 'gibber'])
         fail('Should not get to this point')
      } catch (error) {
         expect(error.message).toMatch(/.*ambiguous argument 'gibber': unknown revision or path.*/)
      }
   })

   it('is a proper array of arguments', async () => {
      const res = await TestRepoSetup.repo.raw(['log', '-1'])

      expect(res).toMatch(/.*commit 4, second on Branch2.*/)
      expect(res).toMatch(/(?!commit 3, but first on Branch2.*)/)
      expect(res).toMatch(/(?!commit 2\n\n\s*Body text right here.*)/m)
   })

   it('is an array item with an equals', async () => {
      const res = await TestRepoSetup.repo.raw(['log', '--max-count=2'])

      expect(res).toMatch(/.*commit 4, second on Branch2.*/)
      expect(res).toMatch(/.*commit 3, but first on Branch2.*/)
      expect(res).toMatch(/(?!commit 2.*)/m)
   })
})
