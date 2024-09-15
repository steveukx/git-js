import { promiseError } from '@kwsites/promise-result';
import type { LogResult, SimpleGit } from 'typings';
import {
   assertExecutedCommands,
   assertExecutedCommandsContains,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   like,
   newSimpleGit,
} from './__fixtures__';
import { TaskConfigurationError, pathspec } from '../..';
import {
   COMMIT_BOUNDARY,
   createListLogSummaryParser,
   SPLITTER,
   START_BOUNDARY,
} from '../../src/lib/parsers/parse-list-log-summary';

describe('log', () => {
   let git: SimpleGit;

   beforeEach(() => (git = newSimpleGit()));

   it('follow option is added as a suffix', async () => {
      git.log({
         'file': 'index.js',
         'format': { hash: '%H' },
         '--fixed-strings': null,
      });
      await closeWithSuccess();

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H${COMMIT_BOUNDARY}`,
         '--follow',
         '--fixed-strings',
         '--',
         'index.js'
      );
   });

   it('follow option works with explicit pathspec', async () => {
      git.log({
         'file': 'index.js',
         'format': { hash: '%H' },
         '--fixed-strings': null,
         'path': pathspec('file2'),
      });
      await closeWithSuccess();

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H${COMMIT_BOUNDARY}`,
         '--follow',
         '--fixed-strings',
         '--',
         'index.js',
         'file2'
      );
   });

   it('follow option works with pathspec workaround', async () => {
      git.log({
         'format': { hash: '%H' },
         'file': 'index.js',
         '--': null,
      });
      await closeWithSuccess();

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H${COMMIT_BOUNDARY}`,
         '--follow',
         '--',
         'index.js'
      );
   });

   it('with stat=4096 and custom format / splitter', async () => {
      const task = git.log({
         '--stat': '4096',
         'splitter': ' !! ',
         'format': { hash: '%H', author: '%aN' },
      });
      await closeWithSuccess(`
òòòòòò 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b !! kobbikobb òò
 foo.js | 113 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------------------------------
 1 file changed, 70 insertions(+), 43 deletions(-)

      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H !! %aN${COMMIT_BOUNDARY}`,
         '--stat=4096'
      );

      let actual = await task;
      expect(actual).toEqual(
         like({
            total: 1,
            latest: like({
               author: 'kobbikobb',
               hash: '5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b',
            }),
            all: [
               like({
                  diff: {
                     changed: 1,
                     deletions: 43,
                     insertions: 70,
                     files: [
                        {
                           file: 'foo.js',
                           changes: 113,
                           insertions: 70,
                           deletions: 43,
                           binary: false,
                        },
                     ],
                  },
               }),
            ],
         })
      );
   });

   it('with shortstat', async () => {
      const task = git.log(['--shortstat']);
      await closeWithSuccess(`
${START_BOUNDARY} 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b${SPLITTER}2019-07-18 00:10:25 +0000${SPLITTER}Exposes issue #382${SPLITTER}HEAD -> pr/383${SPLITTER}${SPLITTER}kobbikobb${SPLITTER}jakobjo@temposoftware.com${COMMIT_BOUNDARY}
 1 file changed, 70 insertions(+), 43 deletions(-)

${START_BOUNDARY} 4ecd1349876c3914b0294fcfa482c8d3add054db${SPLITTER}2019-07-14 09:25:52 +0100${SPLITTER}1.121.0${SPLITTER}tag: v1.121.0, origin/master, origin/HEAD, master${SPLITTER}${SPLITTER}Steve King${SPLITTER}steve@mydev.co${COMMIT_BOUNDARY}
 1 file changed, 1 insertion(+), 1 deletion(-)

${START_BOUNDARY} 1e4bf3959481d20586e05c849e965b015c400187${SPLITTER}2019-07-14 09:25:33 +0100${SPLITTER}Merge branch 'dependencies'${SPLITTER}${SPLITTER}${SPLITTER}Steve King${SPLITTER}steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY} d2934ee302221577157640cb8cc4995a915f7367${SPLITTER}2019-07-14 09:15:16 +0100${SPLITTER}Update dependencies to remove fully deprecated (and now vulnerable) nodeunit while the v2 rewrite is in progress${SPLITTER}origin/dependencies, dependencies${SPLITTER}${SPLITTER}Steve King${SPLITTER}steve@mydev.co${COMMIT_BOUNDARY}
 3 files changed, 71 insertions(+), 2254 deletions(-)
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`,
         '--shortstat'
      );

      const log = await task;
      expect(log.all).toHaveLength(4);
      expect(log.latest?.diff).toEqual({ changed: 1, deletions: 43, insertions: 70, files: [] });
      expect(log.all[3].diff).toEqual({ changed: 3, deletions: 2254, insertions: 71, files: [] });
   });

   it('with stat', async () => {
      const task = git.log(['--stat']);
      await closeWithSuccess(`
òòòòòò 5806c0c1c5d8f8a949e95f8e1cbff7e149eef96b ò 2019-07-18 00:10:25 +0000 ò Exposes issue #382 ò HEAD -> pr/383 ò  ò kobbikobb ò jakobjo@temposoftware.com òò
 foo.js | 113 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------------------------------
 1 file changed, 70 insertions(+), 43 deletions(-)

òòòòòò 4ecd1349876c3914b0294fcfa482c8d3add054db ò 2019-07-14 09:25:52 +0100 ò 1.121.0 ò tag: v1.121.0, origin/master, origin/HEAD, master ò  ò Steve King ò steve@mydev.co òò
 package.json | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

òòòòòò 1e4bf3959481d20586e05c849e965b015c400187 ò 2019-07-14 09:25:33 +0100 ò Merge branch 'dependencies' ò  ò  ò Steve King ò steve@mydev.co òò
òòòòòò d2934ee302221577157640cb8cc4995a915f7367 ò 2019-07-14 09:15:16 +0100 ò Update dependencies to remove fully deprecated (and now vulnerable) nodeunit while the v2 rewrite is in progress ò origin/dependencies, dependencies ò  ò Steve King ò steve@mydev.co òò
 .gitignore   |    1 -
 package.json |   12 +-
 yarn.lock    | 2312 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 3 files changed, 71 insertions(+), 2254 deletions(-)
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`,
         '--stat'
      );

      const log = await task;
      expect(log.all).toHaveLength(4);
      expect(log.all[0]).toEqual(
         expect.objectContaining({
            diff: {
               changed: 1,
               deletions: 43,
               insertions: 70,
               files: [
                  { file: 'foo.js', changes: 113, insertions: 70, deletions: 43, binary: false },
               ],
            },
         })
      );
      expect(log.all[2]).toEqual(expect.objectContaining({ diff: null }));
      expect(log.all[3].diff?.files).toHaveLength(3);
   });

   it('allows for multi-line commit messages', async () => {
      const task = git.log({ multiLine: true });
      await closeWithSuccess(`
${START_BOUNDARY}aaf7f71d53fdbe5f1783f4cc34514cb1067b9131 ò 2019-07-09 11:33:17 +0100 ò hello world ò HEAD -> master ò hello
world
 ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}592ea103c33666fc4faf80e7fd68e655619ce137 ò 2019-07-03 07:11:52 +0100 ò blah ò  ò blah
 ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:òòòòòò %H ò %aI ò %s ò %D ò %B ò %aN ò %aE${COMMIT_BOUNDARY}`
      );

      expect((await task).all).toEqual([
         expect.objectContaining({
            body: 'hello\nworld\n',
            message: 'hello world',
         }),
         expect.objectContaining({
            body: 'blah\n',
            message: 'blah',
         }),
      ]);
   });

   it('allows for single-line commit messages', async () => {
      const task = git.log({ multiLine: false });
      await closeWithSuccess(`
${START_BOUNDARY}aaf7f71d53fdbe5f1783f4cc34514cb1067b9131 ò 2019-07-09 11:33:17 +0100 ò hello world ò HEAD -> master ò  ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}592ea103c33666fc4faf80e7fd68e655619ce137 ò 2019-07-03 07:11:52 +0100 ò blah ò  ò  ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:òòòòòò %H ò %aI ò %s ò %D ò %b ò %aN ò %aE${COMMIT_BOUNDARY}`
      );

      expect((await task).all).toEqual([
         expect.objectContaining({
            body: '',
            message: 'hello world',
         }),
         expect.objectContaining({
            body: '',
            message: 'blah',
         }),
      ]);
   });

   it('allows for custom format multi-line commit messages', async () => {
      const task = git.log({ format: { body: '%B', hash: '%H' }, splitter: '||' });
      await closeWithSuccess(`
${START_BOUNDARY}hello
world
||aaf7f71d53fdbe5f1783f4cc34514cb1067b9131${COMMIT_BOUNDARY}
${START_BOUNDARY}blah
||592ea103c33666fc4faf80e7fd68e655619ce137${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands('log', `--pretty=format:òòòòòò %B||%H${COMMIT_BOUNDARY}`);

      expect((await task).all).toEqual([
         { hash: 'aaf7f71d53fdbe5f1783f4cc34514cb1067b9131', body: 'hello\nworld\n' },
         { hash: '592ea103c33666fc4faf80e7fd68e655619ce137', body: 'blah\n' },
      ]);
   });

   it('picks out the latest item', async () => {
      const task = git.log();
      await closeWithSuccess(`
${START_BOUNDARY}ca931e641eb2929cf86093893e9a467e90bf4c9b ò 2016-01-04 18:54:56 +0100 ò Fix log.latest. (HEAD, stmbgr-master) ò stmbgr ò stmbgr@gmail.com${COMMIT_BOUNDARY}
${START_BOUNDARY}8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò 2016-01-03 16:02:22 +0000 ò Release 1.20.0 (origin/master, origin/HEAD, master) ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò 2016-01-03 16:02:04 +0000 ò Support for any parameters to \`git log\` by supplying \`options\` as an array (tag: 1.20.0) ò Steve King ò ste${COMMIT_BOUNDARY}
${START_BOUNDARY}207601debebc170830f2921acf2b6b27034c3b1f ò 2016-01-03 15:50:58 +0000 ò Release 1.19.0 ò Steve King ò steve@mydev.co${COMMIT_BOUNDARY}
      `);

      expect(await task).toEqual(
         like({
            latest: like({
               hash: 'ca931e641eb2929cf86093893e9a467e90bf4c9b',
            }),
            total: 4,
         })
      );
   });

   it('with custom format option', async () => {
      const task = git.log({
         format: {
            myhash: '%H',
            message: '%s',
            refs: '%D',
         },
      });
      await closeWithSuccess(`
${START_BOUNDARY}ca931e641eb2929cf86093893e9a467e90bf4c9b ò Fix log.latest. ò HEAD, stmbgr-master${COMMIT_BOUNDARY}
${START_BOUNDARY}8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò Release 1.20.0 ò origin/master, origin/HEAD, master${COMMIT_BOUNDARY}
${START_BOUNDARY}d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò Support for any parameters to \`git log\` by supplying \`options\` as an array ò tag: 1.20.0${COMMIT_BOUNDARY}
${START_BOUNDARY}207601debebc170830f2921acf2b6b27034c3b1f ò Release 1.19.0 ò ${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H ò %s ò %D${COMMIT_BOUNDARY}`
      );
      expect(await task).toEqual(
         like({
            latest: {
               myhash: 'ca931e641eb2929cf86093893e9a467e90bf4c9b',
               message: 'Fix log.latest.',
               refs: 'HEAD, stmbgr-master',
            },
         })
      );
   });

   it('with custom format option on multiline commit', async () => {
      const task = git.log({
         format: {
            myhash: '%H',
            message: '%b',
            refs: '%D',
         },
      });
      await closeWithSuccess(`
${START_BOUNDARY}ca931e641eb2929cf86093893e9a467e90bf4c9b ò Fix log.latest.

Describe the fix ò HEAD, stmbgr-master${COMMIT_BOUNDARY}
${START_BOUNDARY}8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805 ò Release 1.20.0 ò origin/master, origin/HEAD, master${COMMIT_BOUNDARY}
${START_BOUNDARY}d4bdd0c823584519ddd70f8eceb8ff06c0d72324 ò Support for any parameters to \`git log\` by supplying \`options\` as an array ò tag: 1.20.0${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands(
         'log',
         `--pretty=format:${START_BOUNDARY}%H ò %b ò %D${COMMIT_BOUNDARY}`
      );
      expect(await task).toEqual(
         like({
            latest: {
               myhash: 'ca931e641eb2929cf86093893e9a467e90bf4c9b',
               message: 'Fix log.latest.\n\nDescribe the fix',
               refs: 'HEAD, stmbgr-master',
            },
            all: [
               like({ refs: 'HEAD, stmbgr-master' }),
               like({ refs: 'origin/master, origin/HEAD, master' }),
               like({ refs: 'tag: 1.20.0' }),
            ],
         })
      );
   });

   it('with custom format %b option on multiline commit', async () => {
      const task = git.log({
         format: {
            message: '%b',
         },
      });
      await closeWithSuccess(`
${START_BOUNDARY}abc

def${COMMIT_BOUNDARY}
${START_BOUNDARY}ghi${COMMIT_BOUNDARY}
${START_BOUNDARY}jkl${COMMIT_BOUNDARY}
      `);

      assertExecutedCommands('log', `--pretty=format:${START_BOUNDARY}%b${COMMIT_BOUNDARY}`);
      expect(await task).toEqual(
         like({
            latest: { message: 'abc\n\ndef' },
            all: [{ message: 'abc\n\ndef' }, { message: 'ghi' }, { message: 'jkl' }],
         })
      );
   });

   describe('parser', () => {
      let actual, expected;
      const splitOn = {
         PIPES: '||',
         SEMI: ';',
         SEMIS: ';;;;;',
      };

      it('three item stash', async () => {
         const parser = createListLogSummaryParser(splitOn.SEMIS);
         const actual = parser(`

${START_BOUNDARY}aaa;;;;;2018-09-13 06:52:30 +0100;;;;;WIP on master: 2942035 blah (refs/stash);;;;;Steve King;;;;;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}bbb;;;;;2018-09-13 06:52:10 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}ccc;;;;;2018-09-13 06:48:22 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${COMMIT_BOUNDARY}

      `);

         expect(actual).toEqual(
            like({
               total: 3,
               latest: like({
                  hash: 'aaa',
               }),
               all: [like({ hash: 'aaa' }), like({ hash: 'bbb' }), like({ hash: 'ccc' })],
            })
         );
      });

      it('parses empty values', () => {
         const parser = createListLogSummaryParser(SPLITTER, ['a', 'b']);
         const actual = parser(`
${START_BOUNDARY}f9ce27bb29e1a6971b7fdb7f19af6197be75061c${SPLITTER}ce55825${COMMIT_BOUNDARY}
${START_BOUNDARY}ce55825e8dd96489be7bfedf456ac93c78fb3cfd${SPLITTER}${COMMIT_BOUNDARY}
${START_BOUNDARY}${SPLITTER}${COMMIT_BOUNDARY}
`);
         expect(actual.all).toEqual([
            { a: 'f9ce27bb29e1a6971b7fdb7f19af6197be75061c', b: 'ce55825' },
            { a: 'ce55825e8dd96489be7bfedf456ac93c78fb3cfd', b: '' },
            { a: '', b: '' },
         ]);
      });

      it('parses regular log', () => {
         const parser = createListLogSummaryParser(splitOn.PIPES, ['hash', 'message']);
         actual = parser(`
${START_BOUNDARY}a9d0113c896c69d24583f567030fa5a8053f6893||Add support for 'git.raw' (origin/add_raw, add_raw)${COMMIT_BOUNDARY}
${START_BOUNDARY}d8cb111160e0a5925ef9b0bf21abda96d87fdc83||Merge remote-tracking branch 'origin/master' into add_raw${COMMIT_BOUNDARY}
${START_BOUNDARY}204f2fd1d77ee5f8475c47f44acc8014d7534b00||Add support for 'git.raw'${COMMIT_BOUNDARY}
${START_BOUNDARY}1dde94c3a06b6e9b7cc88fb32ee23d79eaf39aa6||Merge pull request #143 from steveukx/integration-test${COMMIT_BOUNDARY}
${START_BOUNDARY}8b613d080027354d4e8427d93b3f839ebb38c39a||Add broken-chain tests${COMMIT_BOUNDARY}
`);

         expected = like({
            latest: {
               hash: 'a9d0113c896c69d24583f567030fa5a8053f6893',
               message: `Add support for 'git.raw' (origin/add_raw, add_raw)`,
            },
         });

         expect(actual).toEqual(expected);
      });

      it('includes refs detail separate to commit message', () => {
         const parser = createListLogSummaryParser(splitOn.SEMI, [
            'hash',
            'date',
            'message',
            'refs',
            'author_name',
            'author_email',
         ]);
         actual = parser(`
${START_BOUNDARY}686f728356919989acd412c5f323d858acd5b873;2019-03-22 19:21:50 +0000;Merge branch 'x' of y/git-js into xy;HEAD -> RobertAKARobin-feature/no-refs-in-log;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}1787912f37880deeb302b75b3dfb0c0d47a42572;2019-03-22 19:21:08 +0000;1.108.0;tag: v1.108.0, origin/master, origin/HEAD, master;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}167e909a9f947889067ea59a54e0f8b5a9cf9225;2019-03-22 19:20:21 +0000;Remove \`.npmignore\` - publishing uses the \`package.json\` \`files\` array instead;;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}f3f103257fefb4a0f6cef5d65d6466d2dda105a8;2019-03-22 19:00:04 +0000;Merge branch 'tvongeldern-master';;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}6dac0c61d77fcbb9b7c10848d3be55bb84217b1b;2019-03-22 18:59:44 +0000;Switch to utility function in place of constant;tvongeldern-master;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
      `);

         expected = like({
            hash: '686f728356919989acd412c5f323d858acd5b873',
            message: `Merge branch 'x' of y/git-js into xy`,
         });

         expect(actual.latest).toEqual(expected);
      });

      it('includes body detail in log message', () => {
         const parser = createListLogSummaryParser(splitOn.SEMI, [
            'hash',
            'date',
            'message',
            'refs',
            'body',
            'author_name',
            'author_email',
         ]);
         actual = parser(`
${START_BOUNDARY}f1db07b4d526407c419731c5d6863a019f4bc051;2019-03-23 08:04:04 +0000;Merge branch 'master' into pr/333;HEAD -> pr/333;# Conflicts:
#       src/git.js
#       test/unit/test-log.js
;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}8a5278c03a4dce0d2da64f8743d6e296b4060122;2019-03-23 07:59:05 +0000;Change name of the '%d' placeholder to'refs';master, RobertAKARobin-feature/git-log-body;;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}e613462dc8384deab7c4046e7bc8b5370a295e14;2019-03-23 07:24:21 +0000;Change name of the '%d' placeholder to'refs';;;Steve King;steve@mydev.co${COMMIT_BOUNDARY}
      `);

         expected = `# Conflicts:
#       src/git.js
#       test/unit/test-log.js
`;

         expect(actual.latest.body).toEqual(expected);
      });
   });

   describe('configuration', () => {
      it('supports optionally disabling mail-map', async () => {
         git.log({ mailMap: false });
         await closeWithSuccess();
         assertExecutedCommands(
            'log',
            `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%an${SPLITTER}%ae${COMMIT_BOUNDARY}`
         );
      });

      it('supports optional non-ISO dates', async () => {
         git.log({ strictDate: false });
         await closeWithSuccess();

         assertExecutedCommands(
            'log',
            `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%ai${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`
         );
      });

      it('supports custom from/to range', async () => {
         const from = 'from';
         const to = 'to';

         git.log({ from, to });
         await closeWithSuccess();

         assertCommandAppended(`${from}...${to}`);
      });

      it('supports custom symmetric from/to range', async () => {
         const from = 'from';
         const to = 'to';

         git.log({ from, to, symmetric: false });
         await closeWithSuccess();

         assertCommandAppended(`${from}..${to}`);
      });

      it('supports custom non-symmetric from/to range', async () => {
         const from = 'from';
         const to = 'to';

         git.log({ from, to, symmetric: true });
         await closeWithSuccess();

         assertCommandAppended(`${from}...${to}`);
      });

      it('supports custom splitters', async () => {
         const task = git.log({ splitter: '::' });
         await closeWithSuccess(`
${START_BOUNDARY}ca931e641eb2929cf86093893e9a467e90bf4c9b::2016-01-04 18:54:56 +0100::Fix log.latest. (HEAD, stmbgr-master)::stmbgr::stmbgr@gmail.com${COMMIT_BOUNDARY}
${START_BOUNDARY}8655cb1cf2a3d6b83f4e6f7ff50ee0569758e805::2016-01-03 16:02:22 +0000::Release 1.20.0 (origin/master, origin/HEAD, master)::Steve King::steve@mydev.co${COMMIT_BOUNDARY}
${START_BOUNDARY}d4bdd0c823584519ddd70f8eceb8ff06c0d72324::2016-01-03 16:02:04 +0000::Support for any parameters to \`git log\` by supplying \`options\` as an array (tag: 1.20.0)::Steve King::ste${COMMIT_BOUNDARY}
${START_BOUNDARY}207601debebc170830f2921acf2b6b27034c3b1f::2016-01-03 15:50:58 +0000::Release 1.19.0::Steve King::steve@mydev.co${COMMIT_BOUNDARY}
      `);

         assertExecutedCommands(
            'log',
            `--pretty=format:${START_BOUNDARY}%H::%aI::%s::%D::%b::%aN::%aE${COMMIT_BOUNDARY}`
         );

         expect(await task).toEqual(
            like({
               latest: like({
                  hash: 'ca931e641eb2929cf86093893e9a467e90bf4c9b',
               }),
               total: 4,
            })
         );
      });

      it('supports options array', async () => {
         git.log(['--some=thing']);
         await closeWithSuccess();

         assertCommandAppended('--some=thing');
      });

      it('supports max count shorthand property', async () => {
         git.log({ n: 5 });
         await closeWithSuccess();

         assertCommandAppended('--max-count=5');
      });

      it('supports max count long property', async () => {
         git.log({ '--max-count': 5 });
         await closeWithSuccess();

         assertCommandAppended('--max-count=5');
      });

      it('supports custom options', async () => {
         git.log({ 'n': 5, '--custom': null, '--custom-with-value': '123' });
         await closeWithSuccess();

         assertCommandAppended('--max-count=5', '--custom', '--custom-with-value=123');
      });

      it('max count appears before file', async () => {
         git.log({ file: '/foo/bar.txt', n: 10 });
         await closeWithSuccess();

         assertCommandAppended('--max-count=10', '--follow', '--', '/foo/bar.txt');
      });

      function assertCommandAppended(...things: string[]) {
         assertExecutedCommands(
            'log',
            `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`,
            ...things
         );
      }
   });

   describe('usage:', () => {
      it('passes result to callback', async () => {
         const then = jest.fn();
         const task = git.log(['--some-option'], then);
         await closeWithSuccess();
         expect(then).toHaveBeenCalledWith(null, await task);
      });

      it('when awaiting array option', async () => {
         git.log(['--all']);
         await closeWithSuccess();
         assertExecutedCommandsContains('--all');
      });

      it.each([
         [{ from: 'from' }, 'from...'],
         [{ to: 'to' }, '...to'],
         [{ from: 'from', to: '' }, 'from...'],
         [{ from: '', to: 'to' }, '...to'],
         [{ from: 'from', symmetric: true }, 'from...'],
         [{ to: 'to', symmetric: true }, '...to'],
         [{ from: 'from', symmetric: false }, 'from..'],
         [{ to: 'to', symmetric: false }, '..to'],
      ])(`supports partial with options %s`, async (options, result) => {
         git.log(options);

         await closeWithSuccess();
         assertExecutedCommandsContains(result);
      });

      it('when awaiting options object', async () => {
         const from = 'from-name';
         const to = 'to-name';

         git.log({ from, to, symmetric: true });
         await closeWithSuccess();

         assertExecutedCommands(
            'log',
            `--pretty=format:${START_BOUNDARY}%H${SPLITTER}%aI${SPLITTER}%s${SPLITTER}%D${SPLITTER}%b${SPLITTER}%aN${SPLITTER}%aE${COMMIT_BOUNDARY}`,
            `${from}...${to}`
         );
      });
   });

   describe('deprecations', () => {
      it('rejects from and to as strings', async () => {
         const queue = promiseError((git.log as any)('FROM', 'TO'));
         assertGitError(await queue, 'should be replaced with', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('supports ListLogSummary without generic type', async () => {
         const summary: Promise<LogResult> = git.log({ from: 'from', to: 'to' });
         await closeWithSuccess();

         expect(summary).not.toBe(undefined);
      });
   });
});
