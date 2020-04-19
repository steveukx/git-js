export type SimpleGitTaskErrorCallback = (error: Error) => void;
export type SimpleGitTaskSuccessCallback<R> = (error: null, response: R) => void;

export type SimpleGitTaskCallback<R> = SimpleGitTaskErrorCallback & SimpleGitTaskSuccessCallback<R>;

export function taskCallback<R> (response: Promise<R>, callback?: SimpleGitTaskCallback<R>) {

   if (typeof callback !== 'function') {
      return;
   }

   response.then(
      (data: R) => callback(null, data),
      (err: Error) => callback(err)
   )

}
