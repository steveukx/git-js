import { ApiOptions, ApiOptionsArray, ApiOptionsObject } from '../interfaces/api-options';

export function isOptionsObject(thing: ApiOptions): thing is ApiOptionsObject {
   return thing && typeof thing === 'object';
}

export function isOptionsArray(thing: ApiOptions): thing is ApiOptionsArray {
   return Array.isArray(thing);
}

export function optionsToCommandArray(options: ApiOptions): string[] {

   if (isOptionsArray(options)) {
      return options;
   }

   if (isOptionsObject(options)) {
      return Object.keys(options).reduce((all: string[], key: string) => {
         const value = options[key];
         if (typeof value === 'string') {
            all.push(`${ key }=${ value }`);
         }
         else {
            all.push(key);
         }

         return all;
      }, []);
   }

   return [];
}
