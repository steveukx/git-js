/**
 * A parsed response summary for calls to `git mv`
 */
export interface MoveResult {
   /**
    * Array of files moved
    */
   moves: Array<{ from: string; to: string }>;
}

import { parseMoveResult } from '../parsers/parse-move';
import type { StringTask } from '../types';
import { asArray } from '../utils';

export function moveTask(from: string | string[], to: string): StringTask<MoveResult> {
   return {
      commands: ['mv', '-v', ...asArray(from), to],
      format: 'utf-8',
      parser: parseMoveResult,
   };
}

export function mv(from: string | string[], to: string): StringTask<MoveResult> {
   return moveTask(from, to);
}
