import { TemplateValue } from './template-values';

/**
 * Marks an interpolated template value as a branch / tag / ref name, rejecting anything that
 * isn't valid according to the rules of `git check-ref-format`.
 *
 * ```typescript
 * await git.cmd`checkout -b ${refName(userInput)}`;
 * ```
 */
export function refName(value: string) {
   return new TemplateValue(String(value), (ref) => {
      if (
         !ref ||
         ref === '@' ||
         ref.includes('..') ||
         ref.includes('@{') ||
         ref.includes('//') ||
         /[\s~^:?*[\\]/.test(ref) ||
         ref.endsWith('/') ||
         ref.endsWith('.') ||
         ref.split('/').some((part) => part.startsWith('.') || part.endsWith('.lock'))
      ) {
         return `not a valid ref name`;
      }
      return undefined;
   });
}
