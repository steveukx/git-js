
export enum LocaleTokens {
   ADD_ADD,
   ADD_FAIL,

   INIT_EXISTING,
   INIT_REPO,

   REMOTE_FETCH,
   REMOTE_PUSH,

   TAG_SORT,
}

export const l10n = {

   [LocaleTokens.ADD_ADD]: 'add',
   [LocaleTokens.ADD_FAIL]: /pathspec '(.+)' did not match any files/,

   [LocaleTokens.INIT_EXISTING]: /existing/,
   [LocaleTokens.INIT_REPO]: /\s+(repository in)\s+/,

   [LocaleTokens.REMOTE_FETCH]: 'fetch',
   [LocaleTokens.REMOTE_PUSH]: 'push',

   [LocaleTokens.TAG_SORT]: /^--sort=/,
};
