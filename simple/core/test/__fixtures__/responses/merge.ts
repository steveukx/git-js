type StringLike = string | (() => string);

export function autoMergeResponse(...responses: StringLike[]): string {
   let response = responses.map((r) => (typeof r === 'function' ? r() : String(r))).join('');
   if (/^CONFLICT/.test(response)) {
      response += `\nAutomatic merge failed; fix conflicts and then commit the result.`;
   }

   return response;
}

export function autoMergeConflict(fileName = 'fail.txt', reason = 'content') {
   return `${autoMergeFile(fileName)}
CONFLICT (${reason}): Merge conflict in ${fileName}`;
}

export function autoMergeFile(fileName = 'pass.txt') {
   return `
Auto-merging ${fileName}`;
}

export function mergeMadeByStrategy(strategy: 'recursive') {
   return `
Merge made by the '${strategy}' strategy.
 ccc   | 6 +++---
 dd    | 2 ++
 2 files changed, 5 insertions(+), 3 deletions(-)
 create mode 100644 dd`;
}
