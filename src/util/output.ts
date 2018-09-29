
import debug, { IDebugger } from 'debug';

const name = 'simple-git';
const loggers: {[key: string]: IDebugger} = {
   '': debug('simple-git'),
};

/**
 * When enabled using the environment variable `DEBUG=simple-git` (or `DEBUG="simple-git simple-git:*"` for more detail)
 * outputs logs to the terminal.
 */
export function writeLog(message: any, suffix = '') {

   (loggers[suffix] = (loggers[suffix] || debug(`${name}:${suffix}`)))(message);

}
