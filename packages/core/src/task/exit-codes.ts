/**
 * Process exit codes the task parsers recognise when deciding whether an error is
 * one they can automatically handle rather than surface to the caller.
 */
export enum ExitCodes {
   SUCCESS = 0,
   ERROR = 1,
   NOT_FOUND = -2,
   UNCLEAN = 128,
}
