/**
 * Known process exit codes used by the task parsers to determine whether an error
 * was one they can automatically handle
 */
export enum ExitCodes {
   SUCCESS,
   ERROR,
   NOT_FOUND = -2,
   UNCLEAN = 128,
}
