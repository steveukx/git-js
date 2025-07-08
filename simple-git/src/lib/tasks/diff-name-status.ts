export enum DiffNameStatus {
   ADDED = 'A',
   COPIED = 'C',
   DELETED = 'D',
   MODIFIED = 'M',
   RENAMED = 'R',
   CHANGED = 'T',
   UNMERGED = 'U',
   UNKNOWN = 'X',
   BROKEN = 'B',
}

const diffNameStatus = new Set(Object.values(DiffNameStatus));

export function isDiffNameStatus(input: string): input is DiffNameStatus {
   return diffNameStatus.has(input as DiffNameStatus);
}
