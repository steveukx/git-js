import { GitError } from './git-error';

const REASONS = {
   DISALLOWED_ABBREVIATED: 'disallowed abbreviated or ambiguous option',
   UNKNOWN: '~ unknown ~',
} as const;

export type GitConfigurationErrorReason = keyof typeof REASONS;

function getReason(message?: string): GitConfigurationErrorReason {
   if (!message) {
      return 'UNKNOWN';
   }
   for (const [reason, text] of Object.entries(REASONS)) {
      if (message.startsWith(`fatal: ${text}`)) {
         return reason as GitConfigurationErrorReason;
      }
   }
   return 'UNKNOWN';
}

/**
 * The `GitConfigurationError` is thrown when the `git` process rejects
 * the supplied configuration arguments or environment variables.
 *
 * Check the `.message` property for more detail on why your configuration
 * resulted in an error.
 */
export class GitConfigurationError extends GitError {
   public readonly reason: GitConfigurationErrorReason;

   constructor(message?: string) {
      super(undefined, message);
      this.reason = getReason(message);
   }
}
