import { AsyncResultCallback } from 'async';

export const varType: (thing: any) => string = Function.prototype.call.bind(Object.prototype.toString);
export const objType = '[object Object]';
export const arrType = '[object Array]';
export const funType = '[object Function]';

/**
 * Given any number of arguments, returns the last argument if it is a function, otherwise returns null.
 * @returns {Function|null}
 */
export function trailingFunctionArgument<T = any> (args: IArguments): AsyncResultCallback<T, Error> {
   const trailing = args[args.length - 1];
   return (varType(trailing) === funType) ? trailing : undefined;
}

/**
 * Given any number of arguments, returns the trailing options argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is null.
 * @returns {Object|null}
 */
export function trailingOptionsArgument (args: IArguments) {
   const options = args[(args.length - (trailingFunctionArgument(args) ? 2 : 1))];
   return varType(options) === objType ? options : null;
}

/**
 * Given any number of arguments, returns the trailing options array argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is an empty array.
 * @returns {Array}
 */
export function trailingArrayArgument (args: IArguments) {
   const options = args[(args.length - (trailingFunctionArgument(args) ? 2 : 1))];
   return varType(options) === arrType ? options : [];
}

