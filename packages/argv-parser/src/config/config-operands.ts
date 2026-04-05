// Flags that unambiguously signal a write operation on git config.
export const CONFIG_WRITE_FLAGS = new Set([
   '--add',
   '--edit',
   '--remove-section',
   '--rename-section',
   '--replace-all',
   '--unset',
   '--unset-all',
   '-e',
]);

// Flags that unambiguously signal a read operation.
export const CONFIG_READ_FLAGS = new Set([
   '--get',
   '--get-all',
   '--get-color',
   '--get-colorbool',
   '--get-regexp',
   '--get-urlmatch',
   '--list',
   '-l',
]);

// Sub-command verbs accepted as the first positional by newer git versions.
export const CONFIG_WRITE_VERBS = new Set([
   'edit',
   'remove-section',
   'rename-section',
   'set',
   'unset',
]);
export const CONFIG_READ_VERBS = new Set(['get', 'get-color', 'get-colorbool', 'list']);
