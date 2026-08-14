export function branchSummary(...lines: string[]) {
   return lines.join('\n');
}

export function branchSummaryLine(commit: string, hash = '', current = false) {
   const prefix = current ? '*' : ' ';
   const branch = hash || commit.replace(/[^a-z]/i, '').substr(0, 5);

   return `${prefix} branch-${branch} ${hash || branch.substr(0, 5)} ${commit}`;
}
