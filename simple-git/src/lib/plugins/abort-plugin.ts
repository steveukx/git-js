// abort-plugin.ts
import type { SimpleGitPlugin } from './simple-git-plugin'; // adjust path if required
import { GitPluginError } from '../errors/git-plugin-error'; // adjust path if required

/**
 * Create a spawn.before plugin which will kill the spawned git child
 * if the provided AbortSignal becomes aborted.
 *
 * @param signal optional AbortSignal to observe; if omitted plugin is a no-op.
 */
// avoid the keyof constraint by using an unbound generic (any)
export function abortPlugin(signal?: AbortSignal): SimpleGitPlugin<any> {
  return {
    type: 'spawn.before',
    action(_data, context) {
      if (!signal) return;

      const kill = () => {
        try {
          (context as any).kill(new GitPluginError(undefined, 'abort', 'Abort signaled'));
        } catch {
          /* ignore */
        }
      };

      if (signal.aborted) {
        kill();
        return;
      }

      try {
        signal.addEventListener('abort', kill, { once: true } as AddEventListenerOptions);
      } catch {
        const onAbort = () => { kill(); signal.removeEventListener('abort', onAbort); };
        signal.addEventListener('abort', onAbort);
      }
    },
  } as SimpleGitPlugin<any>;
}
