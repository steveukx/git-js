import { MoveResult } from '../../../typings';
import { TaskParser } from '../types';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<MoveResult>[] = [
   new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
      result.moves.push({from, to});
   }),
];

export const parseMoveResult: TaskParser<string, MoveResult> = function (stdOut): MoveResult {
   return parseStringResponse({moves: []}, parsers, stdOut);
};
