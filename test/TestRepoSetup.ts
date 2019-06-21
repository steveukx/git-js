import * as FsExtra from 'fs-extra'
import * as Path from 'path'
import simplegit, * as Git from '../promise'

export interface SimpleGit extends Git.SimpleGit {}

/**
 * Sets up the Dugite installation of Git, for use by our tests.
 * Repositories are stored outside of the Simple Git one, so that Simple Git doesn't
 * load up the main repository instead, which it will do if the test is inside the Simple Git repo.
 *
 * @export
 * @class TestRepoSetup
 */
export abstract class TestRepoSetup {
   /**
    * Sets up the Simple Git API for use by our tests.
    *
    * @param {string} repoName
    * @memberof TestRepoSetup
    */
   public static async initialise(repoName: string) {
      if (TestRepoSetup.repo) {
         return
      }

      TestRepoSetup.testRepoPath = Path.join(process.cwd(), '..', 'TestRepo', repoName)

      TestRepoSetup.tearDown()

      try {
         if (FsExtra.existsSync(TestRepoSetup.testRepoPath)) {
            FsExtra.removeSync(TestRepoSetup.testRepoPath)
         }
      } catch (error) {
         fail(error)
      }

      try {
         FsExtra.ensureDirSync(TestRepoSetup.testRepoPath)
      } catch (error) {
         fail(error)
      }

      TestRepoSetup.repo = simplegit(TestRepoSetup.testRepoPath).customBinary(
         Path.join(process.cwd(), './test/dugite/cmd/git.exe')
      )

      await TestRepoSetup.repo.init()

      await TestRepoSetup.repo.raw(['config', 'user.name', 'David Bowie'])
      await TestRepoSetup.repo.raw(['config', 'user.email', 'david@bowie.org'])
      // TestRepoSetup.repoPrivate.raw(['config', 'user.name', 'David Bowie']).then(() => {
      //    TestRepoSetup.repoPrivate.raw(['config', 'user.email', 'david@bowie.org']).then(() => {
      //       return TestRepoSetup.repoPrivate
      //    })
      // })
   }

   public static testRepoPath: string

   public static repo: Git.SimpleGit

   static tearDown() {
      if (FsExtra.existsSync(TestRepoSetup.testRepoPath)) {
         FsExtra.emptyDirSync(TestRepoSetup.testRepoPath)

         try {
            FsExtra.removeSync(TestRepoSetup.testRepoPath)
         } catch (error) {
            // We may be using the folder via command line, so no error.
         }

         // Lets delete the parent .../TestRepo folder if we no longer need it
         const dir = Path.dirname(TestRepoSetup.testRepoPath)

         if (FsExtra.existsSync(dir) && FsExtra.readdirSync(dir).length === 0) {
            try {
               FsExtra.removeSync(TestRepoSetup.testRepoPath)
            } catch (error) {
               // We may be using the folder via command line, so no error.
            }
         }
      }
   }

   public static async commitToRepo(
      branchName: string,
      message: string,
      addFiles: string | string[],
      fileContent: string = '',
      deleteFiles: string[] = []
   ): Promise<string> {
      let hash

      try {
         if (!Array.isArray(addFiles)) {
            let fileFullPath = Path.join(TestRepoSetup.testRepoPath, addFiles)
            await FsExtra.ensureFile(fileFullPath)
            await FsExtra.writeFile(fileFullPath, fileContent)

            addFiles = [addFiles]
         }

         const branches = await TestRepoSetup.repo.branchLocal()

         if (!branches.all.includes(branchName)) {
            await TestRepoSetup.repo.checkoutLocalBranch(branchName)
         } else {
            await TestRepoSetup.repo.checkout(branchName)
         }

         for (const file of addFiles) {
            await TestRepoSetup.repo.add(file)
         }

         for (const file of deleteFiles) {
            await TestRepoSetup.repo.rm(file)
         }

         await TestRepoSetup.repo.commit(message, undefined, {
            '--author': 'Roger Waters<roger@pf.org>',
         })

         const res = await TestRepoSetup.repo.log(['--pretty=%H', '-1'])
         hash = res.latest.hash
      } catch (error) {
         fail(error)
      }

      return hash
   }

   public static async renameFileAndCommit(
      branchName: string,
      message: string,
      oldFilePath: string,
      newFilePath: string
   ): Promise<string> {
      let hash

      try {
         const branches = await TestRepoSetup.repo.branchLocal()

         if (!branches.all.includes(branchName)) {
            await TestRepoSetup.repo.checkoutLocalBranch(branchName)
         } else {
            await TestRepoSetup.repo.checkout(branchName)
         }

         await TestRepoSetup.repo.mv(oldFilePath, newFilePath)
         await TestRepoSetup.repo.commit(message, undefined, {
            '--author': 'Roger Waters<roger@pf.org>',
         })

         const res = await TestRepoSetup.repo.log(['--pretty=%H', '-1'])
         hash = res.latest.hash
      } catch (error) {
         fail(error)
      }

      return hash
   }

   public static async createTestCommits(): Promise<string[]> {
      let res: string[] = []

      // Add 1
      res.push(
         await TestRepoSetup.commitToRepo(
            'Branch1',
            '\n\ncommit 0', // The new lines get stripped out by Git.
            'd-day.txt',
            '75th anniversary of the D Day landings.'
         )
      )

      // Rename 1
      res.push(
         await TestRepoSetup.renameFileAndCommit(
            'Branch1',
            'commit 1 - renamed a file',
            'd-day.txt',
            'Code Name Neptune.ts'
         )
      )

      // Change 1
      res.push(
         await TestRepoSetup.commitToRepo(
            'Branch1',
            'commit 2\n\nBody text right here.', // Gets split to subject + body by Git.
            'Code Name Neptune.ts',
            'Celebrations of the 75th anniversary of the D Day landings.'
         )
      )

      // Add 1 and delete 1
      res.push(
         await TestRepoSetup.commitToRepo(
            'Branch2',
            // Set to just the subject, with a space instead of the new line, by Git.
            'commit 3, but first on Branch2\nSome text on the next line',
            'Neptune.ts',
            'Veterans gathered to celebrate 75 years.',
            ['Code Name Neptune.ts']
         )
      )

      // Add 1
      res.push(
         await TestRepoSetup.commitToRepo(
            'Branch2',
            'commit 4, second on Branch2',
            'Inner Folder/Big Celebration.txt',
            'The Queen, President Macron et al were present.'
         )
      )

      return res
   }
}
