import type { BranchSummary } from '../../../typings';
import { BranchSummaryResult } from '../responses/BranchSummary';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<BranchSummaryResult>[] = [
   new LineParser(
      /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
      (result, [current, name, commit, label]) => {
         result.push(branchStatus(current), true, name, commit, label);
      }
   ),
   new LineParser(
      /^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s,
      (result, [current, name, commit, label]) => {
         result.push(branchStatus(current), false, name, commit, label);
      }
   ),
];

function branchStatus(input?: string) {
   return input ? input.charAt(0) : '';
}

export function parseBranchSummary(stdOut: string): BranchSummary {
   return parseStringResponse(new BranchSummaryResult(), parsers, stdOut);
}
