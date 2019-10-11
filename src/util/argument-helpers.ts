/**
 * Given any number of arguments, returns the last argument if it is a function, otherwise returns null.
 * @returns {Function|null}
 */
export function trailingFunctionArgument (args: any) {
   const trailing = args[args.length - 1];
   return (typeof trailing === "function") ? trailing : null;
}

/**
 * Given any number of arguments, returns the trailing options argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is null.
 * @returns {Object|null}
 */
export function trailingOptionsArgument (args: any) {
   const options = args[(args.length - (trailingFunctionArgument(args) ? 2 : 1))];
   return Object.prototype.toString.call(options) === '[object Object]' ? options : null;
}

/**
 * Given any number of arguments, returns the trailing options array argument, ignoring a trailing function argument
 * if there is one. When not found, the return value is an empty array.
 * @returns {Array}
 */
export function trailingArrayArgument (args: any) {
   const options = args[(args.length - (trailingFunctionArgument(args) ? 2 : 1))];
   return Object.prototype.toString.call(options) === '[object Array]' ? options : [];
}

/**
 * Mutates the supplied command array by merging in properties in the options object. When the
 * value of the item in the options object is a string it will be concatenated to the key as
 * a single `name=value` item, otherwise just the name will be used.
 */
export function appendOptions (command: string[], options: any): string[] {
   if (options === null || typeof options !== 'object') {
      return command;
   }

   Object.keys(options).forEach((key: string) => {
      const value = options[key];

      if (typeof value === 'string') {
         command.push(key + '=' + value);
      }
      else {
         command.push(key);
      }
   });

   return command;
}

export function appendOptionsFromArguments (command: string[], args: any): string[] {
   appendOptions(command, trailingOptionsArgument(args));
   command.push(...trailingArrayArgument(args));

   return command;
}

export function flatten<T = string> (...things: Array<T | T[]>): T[] {
   return things.reduce((all: T[], current: T | T[]) => {

      if (Array.isArray(current)) {
         all.push(...current);
      }
      else {
         all.push(current);
      }

      return all;
   }, []);
}
