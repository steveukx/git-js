import { MoveResult } from '../../../typings';
import { parseMoveResult } from '../parsers/parse-move';
import { StringTask } from '../types';
import { asArray } from '../utils';

export function moveTask(from: string | string[], to: string): StringTask<MoveResult> {
   return {
      commands: ['mv', '-v', ...asArray(from), to],
      format: 'utf-8',
      parser: parseMoveResult,
   };
}
