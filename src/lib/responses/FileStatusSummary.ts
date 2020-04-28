import { FileStatusResult } from '../../../typings/response';

export const fromPathRegex = /^(.+) -> (.+)$/;

export class FileStatusSummary implements FileStatusResult {

   public readonly from: string | undefined;

   constructor (
      public path: string,
      public index: string,
      public working_dir: string) {

      if ('R' === (index + working_dir)) {
         const detail = fromPathRegex.exec(path) || [null, path, path];
         this.from = detail[1] || '';
         this.path = detail[2] || '';
      }
   }
}
