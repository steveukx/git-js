import { Maybe, Primitives } from './types';
import { objectToString } from './util';

export interface ArgumentFilterPredicate {
   (input: any): boolean;
}

export function filterType<T>(input: T | any, ...filters: ArgumentFilterPredicate[]): Maybe<T> {
   return filters.some((filter) => filter(input)) ? input : undefined;
}

export const filterArray: ArgumentFilterPredicate = (input): input is Array<any> => {
   return Array.isArray(input);
}

export const filterPrimitives: ArgumentFilterPredicate = (input): input is Primitives => {
   return /number|string|boolean/.test(typeof input);
}

export const filterString: ArgumentFilterPredicate = (input): input is string => {
   return typeof input === 'string';
};

export const filterPlainObject: ArgumentFilterPredicate = (input): input is Object => {
   return !!input && objectToString(input) === '[object Object]';
}

export const filterFunction: ArgumentFilterPredicate = (input): input is Function => {
   return typeof input === 'function';
}

export const filterHasLength: ArgumentFilterPredicate = (input) => {
   if (input == null) {
      return false;
   }

   const hasLength = typeof input === 'string' || (typeof input === 'object' && ('length' in input));

   return hasLength && typeof input.length === 'number';
}
