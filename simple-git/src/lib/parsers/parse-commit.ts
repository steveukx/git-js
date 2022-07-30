import { CommitResult } from '../../../typings';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<CommitResult>[] = [
   new LineParser(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (result, [branch, root, commit]) => {
      result.branch = branch;
      result.commit = commit;
      result.root = !!root;
   }),
   new LineParser(/\s*Author:\s(.+)/i, (result, [author]) => {
      const parts = author.split('<');
      const email = parts.pop();

      if (!email || !email.includes('@')) {
         return;
      }

      result.author = {
         email: email.substr(0, email.length - 1),
         name: parts.join('<').trim(),
      };
   }),
   new LineParser(
      /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
      (result, [changes, insertions, deletions]) => {
         result.summary.changes = parseInt(changes, 10) || 0;
         result.summary.insertions = parseInt(insertions, 10) || 0;
         result.summary.deletions = parseInt(deletions, 10) || 0;
      }
   ),
   new LineParser(
      /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
      (result, [changes, lines, direction]) => {
         result.summary.changes = parseInt(changes, 10) || 0;
         const count = parseInt(lines, 10) || 0;
         if (direction === '-') {
            result.summary.deletions = count;
         } else if (direction === '+') {
            result.summary.insertions = count;
         }
      }
   ),
];

export function parseCommitResult(stdOut: string): CommitResult {
   const result: CommitResult = {
      author: null,
      branch: '',
      commit: '',
      root: false,
      summary: {
         changes: 0,
         insertions: 0,
         deletions: 0,
      },
   };
   return parseStringResponse(result, parsers, stdOut);
}
