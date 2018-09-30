
export class ListLogLine {

   [key: string]: string | undefined;

   public hash: string | undefined;

   constructor(line: string[], fields: string[]) {
      for (let k = 0; k < fields.length; k++) {
         this[fields[k]] = line[k];
      }
   }

}
