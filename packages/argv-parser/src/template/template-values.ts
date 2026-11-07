/**
 * Wrapper for an interpolated template value that must pass extra validation before use, see
 * `remoteUrl` and `refName`.
 */
export class TemplateValue {
   constructor(
      public readonly value: string,
      public readonly validate: (value: string) => string | undefined
   ) {}
}

export type TemplateArgvValue =
   | string
   | number
   | TemplateValue
   | ReadonlyArray<string | number | TemplateValue>;
