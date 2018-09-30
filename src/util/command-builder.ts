
export interface CommandOptionsObject {
   [key: string]: string | undefined | null;
}

/**
 * Mutates the supplied command array by merging in properties in the options object. When the
 * value of the item in the options object is a string it will be concatenated to the key as
 * a single `name=value` item, otherwise just the name will be used.
 */
export function appendOptions (command: string[], options: CommandOptionsObject): string[] {
   if (options === null) {
      return command;
   }

   return Object.keys(options).reduce((all: string[], key: string) => {
      const value = options[key];

      all.push((typeof value === 'string') ? key + '=' + value : key);

      return all;
   }, command);
}
