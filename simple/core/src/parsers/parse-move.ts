import type { MoveResult } from '../tasks/move';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<MoveResult>[] = [
   new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
      result.moves.push({ from, to });
   }),
];

export function parseMoveResult(stdOut: string): MoveResult {
   return parseStringResponse({ moves: [] }, parsers, stdOut);
}
