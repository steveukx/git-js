import { arrType, varType } from './arguments';

export function asArray<T = string>(source: T | T[]): T[] {
   if ((varType(source) === arrType)) {
      return <T[]>source;
   }

   return [<T>source];
}
