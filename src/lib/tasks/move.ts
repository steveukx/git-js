import { MoveResult } from '../../../typings';
import { parseMoveResult } from '../parsers/parse-move';
import { asArray } from '../utils';
import { StringTask } from './task';

export function moveTask(from: string | string[], to: string): StringTask<MoveResult> {
   return {
      commands: ['mv', '-v', ...asArray(from), to],
      format: 'utf-8',
      parser (stdOut, stdErr) {
         return parseMoveResult(stdOut, stdErr);
      }
   };
}
