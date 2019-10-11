import debugLib = require('debug');
import { Debugger } from 'debug';

export const debug: Debugger = debugLib('simple-git');
