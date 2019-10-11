
export function checkIgnoreParser(data: string): string[] {
   return data
      .split(/\n/g)
      .map((file) => file.trim())
      .filter(Boolean);
}
