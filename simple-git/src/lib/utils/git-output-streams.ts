import { TaskResponseFormat } from '../types';
import type { Buffer } from 'node:buffer';

export class GitOutputStreams<T extends TaskResponseFormat = Buffer> {
   constructor(
      public readonly stdOut: T,
      public readonly stdErr: T
   ) {}

   asStrings(): GitOutputStreams<string> {
      return new GitOutputStreams(this.stdOut.toString('utf8'), this.stdErr.toString('utf8'));
   }
}
