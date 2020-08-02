import { TaskParser } from '../tasks/task';
import { MoveResult } from '../../../typings';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<MoveResult>[] = [
   new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
      result.moves.push({from, to});
   }),
];

export const parseMoveResult: TaskParser<string, MoveResult> = function (stdOut): MoveResult {
   return parseStringResponse({moves: []}, parsers, stdOut);
};
