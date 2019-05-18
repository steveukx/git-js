import { Context } from '../interfaces/context';
import { AddResponse } from '../responses';
import { ApiOptions } from '../interfaces/api-options';
import { optionsToCommandArray } from '../util/options';
import { TagListResponse } from '../responses/tag-list.response';
import { l10n, LocaleTokens } from '../responses/locals';


export async function addAnnotatedTag (context: Context,
                           tagName: string,
                           tagMessage: string) {

   return await context.exec(
      ['tag', '-a', '-m', tagMessage, tagName]
   );

}


export async function addTag(context: Context,
                             name: string) {

   return tag(context, [name]);
}

/**
 * Pushes the current tag changes to a remote which can be either a URL or named remote. When not specified uses the
 * default configured remote spec.
 */
export async function pushTags (context: Context,
                                remote: string) {

   throw new Error('Not Implemented');

   // return push(context, remote, ['--tags']);
}


export async function tag (context: Context,
                           options: ApiOptions) {

   return await context.exec(
      ['tag', ...optionsToCommandArray(options)]
   );

}


export async function tags (context: Context,
                           options: ApiOptions): Promise<TagListResponse> {

   const args = ['tag', '-l', ...optionsToCommandArray(options)];
   const hasCustomSort = args.some(function (option) {
      return l10n[LocaleTokens.TAG_SORT].test(option);
   });

   return TagListResponse.parse(await context.exec(args), hasCustomSort);

}
