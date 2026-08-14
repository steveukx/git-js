/**
 * Convenience preset for the common "make a commit" case - spreadable into
 * `allowConfigWrite`. This is a shortcut to save retyping common keys, not a
 * safety judgement and not an exemption: keys allowed this way pass through
 * exactly the same guard as any other allow-listed key.
 *
 * ```ts
 * const git = new SimpleGitCore({ allowConfigWrite: [...allowConfigWriteUser, 'remote.*.url'] });
 * ```
 */
export const allowConfigWriteUser = ['user.name', 'user.email'] as const;
