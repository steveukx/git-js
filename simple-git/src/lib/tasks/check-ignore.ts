import { normalize } from 'node:path';

import type { StringTask } from '../types';

export function checkIgnoreTask(paths: string[]): StringTask<string[]> {
   return {
      commands: ['check-ignore', ...paths],
      format: 'utf-8',
      parser: parseCheckIgnore,
   };
}

/**
 * Parser for the `check-ignore` command - returns each file as a string array
 */
function parseCheckIgnore(text: string): string[] {
   return text.split(/\n/g).map(toPath).filter(Boolean);
}

function toPath(input: string) {
   const path = input.trim().replace(/^["']|["']$/g, '');
   return path && normalize(path);
}
