import { createFixture } from '../create-fixture';

type SmallNumber = 0 | 1 | 2;

function change(count: number, sign: '-' | '+') {
   const label = sign === '-' ? 'deletion' : 'insertion';

   switch (count) {
      case 0:
         return '';
      case 1:
         return `, 1 ${label}(${sign})`;
      default:
         return `, ${count} ${label}s(${sign})`;
   }
}

function line(insertions: SmallNumber, deletions: SmallNumber, fileName: string) {
   return `
      ${fileName} | ${insertions + deletions} ${''.padEnd(insertions, '+')}${''.padEnd(
         deletions,
         '-'
      )}`;
}

export function diffSummarySingleFile(
   insertions: SmallNumber = 1,
   deletions: SmallNumber = 2,
   fileName = 'package.json'
) {
   const stdOut = `${line(insertions, deletions, fileName)}
      1 file changed${change(insertions, '+')}${change(deletions, '-')}
   `;
   return createFixture(stdOut, '');
}

export function diffSummaryMultiFile(
   ...files: Array<{ fileName: string; insertions?: SmallNumber; deletions?: SmallNumber }>
) {
   let add = 0;
   let del = 0;
   let stdOut = '';
   files.forEach(({ insertions = 0, deletions = 0, fileName }) => {
      stdOut += line(insertions, deletions, fileName);
      add += insertions;
      del += deletions;
   });

   stdOut += `
      ${files.length} file${files.length === 1 ? '' : 's'} changed ${change(add, '+')}${change(
         del,
         '-'
      )}
   `;
   return createFixture(stdOut, '');
}
