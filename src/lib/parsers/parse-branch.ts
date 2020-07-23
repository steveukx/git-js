import { BranchSummary } from '../../../typings';
import { BranchSummaryResult } from '../responses/BranchSummary';
import { LineParser, parseStringResponse } from '../utils';
import { TaskParser } from '../tasks/task';

const parsers: LineParser<BranchSummaryResult>[] = [
   new LineParser(/^(\*\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/, (result, [current, name, commit, label]) => {
      result.push(
         !!current,
         true,
         name, commit, label
      );
   }),
   new LineParser(/^(\*\s)?(\S+)\s+([a-z0-9]+)\s(.*)$/, (result, [current, name, commit, label]) => {
      result.push(
         !!current,
         false,
         name, commit, label
      );
   })
];

export const parseBranchSummary: TaskParser<string, BranchSummary> = function (stdOut): BranchSummary {
   return parseStringResponse(new BranchSummaryResult(), parsers, stdOut);
};
