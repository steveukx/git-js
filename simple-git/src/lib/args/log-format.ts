export enum LogFormat {
   NONE = '',
   STAT = '--stat',
   NUM_STAT = '--numstat',
   NAME_ONLY = '--name-only',
   NAME_STATUS = '--name-status',
}

const logFormatRegex = /^--(stat|numstat|name-only|name-status)(=|$)/;

export function logFormatFromCommand(customArgs: string[]) {
   for (let i = 0; i < customArgs.length; i++) {
      const format = logFormatRegex.exec(customArgs[i]);
      if (format) {
         return `--${format[1]}` as LogFormat;
      }
   }

   return LogFormat.NONE;
}

export function isLogFormat(customArg: string | unknown) {
   return logFormatRegex.test(customArg as string);
}
