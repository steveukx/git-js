import { TestRepoSetup } from '../TestRepoSetup'

console.error = jest.fn() // Suppress pointless Git error messages

//#region  Generic test methods, for all Git command test files. Sadly can't be inherited.
const genericMethodName = 'show'
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
         expect(error.message).toMatch(/ambiguous argument 'gibber'/)
      }
   })

   it('rejects a silly array of arguments', async () => {
      try {
         await TestRepoSetup.repo[genericMethodName](['abc', 'def'])
         fail('Should not get to this point')
      } catch (error) {
         expect(error.message).toMatch(/fatal: ambiguous argument 'abc'/)
      }
   })
})
//#endregion

describe('show()', () => {
   it('shows a single commit', async () => {
      const res = await TestRepoSetup.repo.show([commitHashes[0]])

      expect(res).toMatch(new RegExp('commit ' + commitHashes[0]))
   })

   it('shows 1 files contents', async () => {
      const res = await TestRepoSetup.repo.show([commitHashes[2] + ':Code Name Neptune.ts'])

      expect(res).toMatch(/Celebrations of the 75th anniversary of the D Day landings./)
   })

   it('shows another files contents', async () => {
      const spy = jest.spyOn(TestRepoSetup.repo, genericMethodName)

      const res = await TestRepoSetup.repo.show([
         commitHashes[4] + ':Inner Folder/Big Celebration.txt',
      ])

      expect(spy.mock.calls[0][0]).toEqual([commitHashes[4] + ':Inner Folder/Big Celebration.txt'])

      expect(res).toMatch(/The Queen, President Macron et al were present./)
   })
})
