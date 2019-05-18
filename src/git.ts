import {
   add,
   addAnnotatedTag,
   addRemote,
   addTag,
   construct,
   cwd,
   getRemotes,
   init,
   remote,
   removeRemote,
   tags
} from './api';
import { Context } from './interfaces/context';
import { AddResponse, InitResponse, TagListResponse } from './responses';
import { toArrayOf } from './util/types';
import { ContextModel } from './util/context';
import { ApiOptions } from './interfaces/api-options';
import { RemoteResponse } from './responses/remote.response';

export class Git {

   private _queue: Promise<any> = Promise.resolve();

   private readonly _context: Context;

   constructor (context?: Context) {
      this._context = new ContextModel(context);

      this._queue = construct(this._context);

   }

   /**
    * Adds one or more files to source control
    *
    * @param files
    * @returns {Promise<AddResponse>}
    */
   add (files: string | string[]): Promise<AddResponse> {
      return this._queue = this._queue
         .then(() => add(this._context, toArrayOf<string>(files)));
   }

   /**
    * Add an annotated tag to the head of the current branch
    *
    * @param name
    * @param message
    * @returns {Promise<string>}
    */
   addAnnotatedTag (name: string, message: string): Promise<string> {
      return this._queue = this._queue
         .then(() => addAnnotatedTag(this._context, name, message));
   }

   /**
    * Adds a remote to the list of remotes.
    *
    * @param remoteName Name of the repository - eg "upstream"
    * @param remoteRepo Fully qualified SSH or HTTP(S) path to the remote repo
    */
   addRemote (remoteName: string, remoteRepo: string) {
      return this._queue = this._queue
         .then(() => addRemote(this._context, remoteName, remoteRepo));
   }

   /**
    * Add a lightweight tag to the head of the current branch
    *
    * @param name
    * @returns {Promise<AddResponse>}
    */
   addTag (name: string): Promise<AddResponse> {
      return this._queue = this._queue
         .then(() => addTag(this._context, name));
   }

   /**
    * Sets the working directory of the subsequent commands.
    *
    * @param workingDirectory
    * @returns {Promise<string>}
    */
   cwd (workingDirectory: string): Promise<string> {
      return this._queue = this._queue
         .then(() => cwd(this._context, workingDirectory))
         .then(() => this._context.baseDir);
   }

   /**
    * Gets the currently available remotes, setting the optional verbose argument to true includes additional
    * detail on the remotes themselves.
    *
    * @param verbose
    * @returns {Promise<RemoteResponse[]>}
    */
   getRemotes (verbose = false): Promise<RemoteResponse[]> {
      return this._queue = this._queue
         .then(() => getRemotes(this._context, verbose));
   }

   /**
    * Initialize a git repo
    *
    * @param bare
    * @returns {Promise<InitResponse>}
    */
   init (bare = false): Promise<InitResponse> {
      return this._queue = this._queue
         .then(() => init(this._context, bare));
   }

   /**
    * Call any `git remote` function with arguments passed as an array of strings.
    */
   remote (options: ApiOptions) {
      return this._queue = this._queue
         .then(() => remote(this._context, options));
   }

   /**
    * Adds a remote to the list of remotes.
    *
    * @param remoteName Name of the repository - eg "upstream"
    */
   removeRemote (remoteName: string) {
      return this._queue = this._queue
         .then(() => removeRemote(this._context, remoteName));
   }

   /**
    * Call any `git tag` function with arguments passed as an array of strings.
    *
    * @param [options]
    * @returns {Promise<TagListResponse>}
    */
   tag (options: ApiOptions = {}): Promise<TagListResponse> {
      return this._queue = this._queue
         .then(() => tags(this._context, options));
   }

   /**
    * List all tags. When using git 2.7.0 or above, include an options object with `"--sort": "property-name"` to
    * sort the tags by that property instead of using the default semantic versioning sort.
    *
    * Note, supplying this option when it is not supported by your Git version will cause the operation to fail.
    *
    * @param [options]
    * @returns {Promise<TagListResponse>}
    */
   tags (options: ApiOptions = {}): Promise<TagListResponse> {
      return this._queue = this._queue
         .then(() => tags(this._context, options));
   }

}
