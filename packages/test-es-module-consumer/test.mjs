import { strictEqual } from 'assert';
import simpleGit, { ResetMode } from 'simple-git';

exec('imports default', async () => {
   strictEqual(
      await simpleGit().checkIsRepo(),
      true,
      'expected the current directory to be a valid git root',
   );
});

exec('imports named exports', async () => {
   strictEqual(
      /hard/.test(ResetMode.HARD),
      true,
      'expected valid ResetMode enum'
   );
});

function exec (name, runner) {
   runner()
      .then(() => console.log(`${ name }: OK`))
      .catch((e) => {
         console.error(`${ name }: ${ e.message }`);
         throw e;
      });
}
