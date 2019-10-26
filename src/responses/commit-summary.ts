
export interface CommitAuthor {
   email: string;
   name: string;
}

export interface CommitChangeSummary {
   changes: number;
   insertions: number;
   deletions: number;
}

export class CommitSummary {

   public branch = '';
   public commit = '';
   public author: CommitAuthor | null = null;
   public summary: CommitChangeSummary = {
      changes: 0,
      deletions: 0,
      insertions: 0,
   };

}

export const COMMIT_BRANCH_MESSAGE_REGEX = /\[([^\s]+) ([^\]]+)/;
export const COMMIT_AUTHOR_MESSAGE_REGEX = /\s*Author:\s(.+)/i;
function setBranchFromCommit (commitSummary: CommitSummary, commitData: string[] | null) {
   if (commitData) {
      commitSummary.branch = commitData[1];
      commitSummary.commit = commitData[2];
   }
}

function setSummaryFromCommit (commitSummary: CommitSummary, commitData: string[] | null) {
   if (!commitData) {
      console.log('setSummaryFromCommit: no commitData');
      return;
   }

   if (!commitSummary.branch) {
      console.log('setSummaryFromCommit: no commitSummary.branch');
      return;
   }

   if (commitSummary.branch && commitData) {
      commitSummary.summary.changes = toNumber(commitData[1]);
      commitSummary.summary.insertions = toNumber(commitData[2]);
      commitSummary.summary.deletions = toNumber(commitData[3]);
   }
}

function setAuthorFromCommit (commitSummary: CommitSummary, commitData: string[] | null) {
   if (!commitData) {
      return;
   }

   const parts = commitData[1].split('<');
   const email = parts.pop();

   if (!email || email.indexOf('@') <= 0) {
      return;
   }

   commitSummary.author = {
      email: email.substr(0, email.length - 1),
      name: parts.join('<').trim()
   };
}

export function commitSummaryParser(commit: string): CommitSummary {
   const commitSummary = new CommitSummary();
   const lines = commit.trim().split('\n');

   setBranchFromCommit(commitSummary, COMMIT_BRANCH_MESSAGE_REGEX.exec(String(lines.shift())));

   if (COMMIT_AUTHOR_MESSAGE_REGEX.test(lines[0])) {
      setAuthorFromCommit(commitSummary, COMMIT_AUTHOR_MESSAGE_REGEX.exec(String(lines.shift())));
   }

   // TODO: this fails in compilation if the regular expression is a constant outside of the function
   setSummaryFromCommit(commitSummary, /(\d+)[^,]*(?:,\s*(\d+)[^,]*)?(?:,\s*(\d+))?/g.exec(lines[0] || ''));

   return commitSummary;
}

function toNumber (numeric: string): number {
   return numeric && parseInt(numeric, 10) || 0;
}
