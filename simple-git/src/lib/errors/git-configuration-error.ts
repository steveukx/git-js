import { GitError } from './git-error';

const REASONS = {
   DISALLOWED_ABBREVIATED: {
      text: 'disallowed abbreviated or ambiguous option',
      solution:
         'Unambiguous abbreviated options blocked with unsafe.allowAbbreviatedOptions setting: {message}',
   },
   UNKNOWN: {
      text: '~ unknown ~',
      solution: undefined,
   },
} as const;

export type GitConfigurationErrorReason = keyof typeof REASONS;

function getReason(message?: string): GitConfigurationErrorReason {
   if (!message) {
      return 'UNKNOWN';
   }
   for (const [reason, { text }] of Object.entries(REASONS)) {
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

   constructor(message = '') {
      const reason = getReason(message);

      super(undefined, REASONS[reason].solution?.replace('{message}', message) ?? message);
      this.reason = reason;
   }
}
