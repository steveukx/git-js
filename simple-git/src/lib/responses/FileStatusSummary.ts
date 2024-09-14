import { FileStatusResult } from '../../../typings';

export const fromPathRegex = /^(.+)\0(.+)$/;

export class FileStatusSummary implements FileStatusResult {
   public readonly from: string | undefined;

   constructor(
      public path: string,
      public index: string,
      public working_dir: string
   ) {
      if (index === 'R' || working_dir === 'R') {
         const detail = fromPathRegex.exec(path) || [null, path, path];
         this.from = detail[2] || '';
         this.path = detail[1] || '';
      }
   }
}
