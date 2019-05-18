import { add, addAnnotatedTag, addTag, construct, cwd, init, tags } from './api';
import { Context } from './interfaces/context';
import { AddResponse, InitResponse, TagListResponse } from './responses';
import { toArrayOf } from './util/types';
import { ContextModel } from './util/context';
import { ApiOptions } from './interfaces/api-options';

export class Git {

   private _queue: Promise<any> = Promise.resolve();

   private readonly _context: Context;

   constructor (context?: Context) {
      this._context = new ContextModel(context);

      this._queue = construct(this._context);

   }

   add (files: string | string[]): Promise<AddResponse> {
      return this._queue = this._queue
         .then(() => add(this._context, toArrayOf<string>(files)));
   }

   addAnnotatedTag (name: string, message: string): Promise<string> {
      return this._queue = this._queue
         .then(() => addAnnotatedTag(this._context, name, message));
   }

   addTag (name: string): Promise<AddResponse> {
      return this._queue = this._queue
         .then(() => addTag(this._context, name));
   }

   cwd (workingDirectory: string): Promise<string> {
      return this._queue = this._queue
         .then(() => cwd(this._context, workingDirectory))
         .then(() => this._context.baseDir);
   }

   init (bare = false): Promise<InitResponse> {
      return this._queue = this._queue
         .then(() => init(this._context, bare));
   }

   tag (options: ApiOptions = {}): Promise<TagListResponse> {
      return this._queue = this._queue
         .then(() => tags(this._context, options));
   }

   tags (options: ApiOptions = {}): Promise<TagListResponse> {
      return this._queue = this._queue
         .then(() => tags(this._context, options));
   }

}
