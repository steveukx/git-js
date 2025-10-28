import { normalize } from 'node:path';

/**
 * Parser for the `check-ignore` command - returns each file as a string array
 */
export const parseCheckIgnore = (text: string): string[] => {
   return text.split(/\n/g).map(toPath).filter(Boolean);
};

function toPath(input: string) {
   const path = input.trim().replace(/^["']|["']$/g, '');
   return path && normalize(path);
}
