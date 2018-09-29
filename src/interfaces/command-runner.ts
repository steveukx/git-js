import { RunnerResponseFormat } from '../constants/runner-response-format.enum';

export interface RunnerOptions {

   /**
    * Configured option determines whether to concat stderr onto the end of stdout - useful
    * for commands such as `fetch` that write to both.
    */
   concatStdErr?: boolean;

   /**
    * Configures the format required by the parser - ordinarily a `utf-8` string, but for commands
    * such as `binaryCatFile` a buffer should be returned to be binary-file safe
    */
   format?: RunnerResponseFormat;

   /**
    * Additional error handling for when the underlying command is intentionally going to fail - for
    * example `checkIsRepo`.
    */
   onError?: (
      exitCode: number,
      content: string,
      resolve: (value?: any) => void,
      reject: (value?: any) => void,
   ) => void;

}

/**
 * Type to be returned by any defaultRunner when they run
 */
export type RunnerResponse = Buffer | string;

/**
 * The defaultRunner used by the library to run a command.
 */
export interface Runner {

   /**
    * Called when there is a task to be run, provided with the commands to pass to any git binary
    * without the actual name of the binary (ie: `git fetch origin` will have `['fetch', 'origin']` as
    * the `commands` and an options object for how the caller needs the response to be returned.
    */
   run: (commands: string[], options: RunnerOptions) => Promise<RunnerResponse>;
}
