import { FetchResult } from '../../../typings';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<FetchResult>[] = [
   new LineParser(/From (.+)$/, (result, [remote]) => {
      result.remote = remote;
   }),
   new LineParser(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) =>{
      result.branches.push({
         name,
         tracking,
      });
   }),
   new LineParser(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
      result.tags.push({
         name,
         tracking,
      });
   })
];

export function parseFetchResult (stdOut: string, stdErr: string): FetchResult {
   const result: FetchResult = {
      raw: stdOut,
      remote: null,
      branches: [],
      tags: [],
   };
   return parseStringResponse(result, parsers, stdOut, stdErr);
}
