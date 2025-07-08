/**
 * Parser for the `check-ignore` command - returns each file as a string array
 */
export const parseCheckIgnore = (text: string): string[] => {
   return text
      .split(/\n/g)
      .map((line) => line.trim())
      .filter((file) => !!file);
};
