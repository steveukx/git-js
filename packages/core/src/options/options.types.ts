/**
 * The value an options object may hold for a given git flag. `null` renders the
 * key as a bare flag (`--quiet`), a string/number renders `key=value`, and an
 * array renders a repeated `key=value` per entry.
 */
export type OptionsValues = null | string | number | (string | number)[];

/** A trailing options object: a map of git flags to their {@link OptionsValues}. */
export type Options = Record<string, OptionsValues>;

/** Narrows {@link Options} to a known set of flags, optionally with typed values. */
export type OptionFlags<FLAGS extends string, VALUE = null> = Partial<Record<FLAGS, VALUE>>;

/**
 * Most tasks accept their trailing options either as an array of raw string
 * arguments or as an {@link Options} object — not both at once.
 */
export type TaskOptions<O extends Options = Options> = string[] | O;

/**
 * The flexible trailing-arguments a task factory accepts: any mix of varargs
 * strings, a single string[] passthrough, and/or a trailing {@link Options}
 * object, normalised by {@link asTaskOptions}.
 */
export type VariadicOptions<O extends Options = Options> = Array<string | TaskOptions<O>>;

export type Maybe<T> = T | undefined;
