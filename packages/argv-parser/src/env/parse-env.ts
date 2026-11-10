import type { ConfigWrite, ParsedConfigActivity } from '../args/parse-argv.types';
import type { Vulnerability, VulnerabilityCategory } from '../vulnerabilities/vulnerability.types';
import { vulnerabilityAnalysis } from '../vulnerabilities/vulnerability-analysis';

const GitEnvKeys = {
   'editor': 'allowUnsafeEditor',
   'git_askpass': 'allowUnsafeAskPass',
   'git_config_global': 'allowUnsafeConfigPaths',
   'git_config_system': 'allowUnsafeConfigPaths',
   'git_config_count': 'allowUnsafeConfigEnvCount',
   'git_config_parameters': 'allowUnsafeConfigEnvCount',
   'git_config': 'allowUnsafeConfigPaths',
   'git_editor': 'allowUnsafeEditor',
   'git_exec_path': 'allowUnsafeExec',
   'git_external_diff': 'allowUnsafeDiffExternal',
   'git_pager': 'allowUnsafePager',
   'git_proxy_command': 'allowUnsafeGitProxy',
   'git_template_dir': 'allowUnsafeTemplateDir',
   'git_sequence_editor': 'allowUnsafeEditor',
   'git_ssh': 'allowUnsafeSshCommand',
   'git_ssh_command': 'allowUnsafeSshCommand',
   'pager': 'allowUnsafePager',
   'prefix': 'allowUnsafeConfigPaths',
   'ssh_askpass': 'allowUnsafeAskPass',
   'visual': 'allowUnsafeEditor',
} as const satisfies Record<string, VulnerabilityCategory>;

const ProtectedEnvKeys = {
   'home': 'allowUnsafeConfigPaths',
   'xdg_config_home': 'allowUnsafeConfigPaths',
} as const satisfies Record<string, VulnerabilityCategory>;

function isProtectedEnvKey(key: string): key is keyof typeof ProtectedEnvKeys {
   return Object.hasOwn(ProtectedEnvKeys, key);
}

type GitEnv = Record<string, string> & {
   git_config_count?: string;
};

function* collectConfigByCount(env: GitEnv): Generator<ConfigWrite> {
   const count = parseInt(env.git_config_count ?? '0', 10);
   for (let index = 0; index < count; index++) {
      const key = env[`git_config_key_${index}`];
      const value = env[`git_config_value_${index}`];

      if (key !== undefined) {
         yield { key: key.toLowerCase().trim(), value, scope: 'env' };
      }
   }
}

function* collectProtectedEnvVulnerabilities(
   env: GitEnv,
   inherited: GitEnv
): Generator<Vulnerability> {
   for (const key of Object.keys(env)) {
      if (isProtectedEnvKey(key) && env[key] !== inherited[key]) {
         const category = ProtectedEnvKeys[key];
         yield {
            category,
            message: `Use of "${key.toUpperCase()}" with a value other than the inherited one is not permitted without enabling ${category}`,
            envKey: key,
         };
      }
   }
}

function* collectConfigVulnerabilities(env: GitEnv): Generator<Vulnerability> {
   for (const key of Object.keys(env)) {
      if (isGitEnvKey(key)) {
         const category = GitEnvKeys[key];
         yield {
            category,
            message: `Use of "${key.toUpperCase()}" is not permitted without enabling ${category}`,
            envKey: key,
         };
      }
   }
}

export function isGitEnvKey(key: string): key is keyof typeof GitEnvKeys {
   return Object.hasOwn(GitEnvKeys, key);
}

/**
 * Whether an environment variable is guarded: any `GIT_*` variable, or one of the variables
 * outside that namespace that `git` reads (eg: `EDITOR`, `PAGER`).
 */
export function isGuardedEnvKey(key: string | unknown) {
   const normalised = String(key).toLowerCase().trim();
   return normalised.startsWith('git_') || isGitEnvKey(normalised);
}

function prepareEnv(env: Record<string, unknown>): GitEnv {
   const gitEnv: GitEnv = {};
   for (const [key, value] of Object.entries(env)) {
      const envKey = key.toLowerCase().trim();
      if (isGuardedEnvKey(envKey) || isProtectedEnvKey(envKey)) {
         gitEnv[envKey] = String(value);
      }
   }
   return gitEnv;
}

/**
 * Parse the environment variables supplied for a `git` child process.
 *
 * @param raw the environment variables supplied for the child process
 * @param inherited the environment the child process would otherwise inherit (typically `process.env`),
 *    `HOME` and `XDG_CONFIG_HOME` are only reported when their value differs from this environment
 */
export function parseEnv(raw: Record<string, unknown>, inherited: Record<string, unknown> = {}) {
   const env = prepareEnv(raw);
   const config: ParsedConfigActivity = {
      read: [],
      write: [...collectConfigByCount(env)],
   };
   const vulnerabilities = [
      ...collectConfigVulnerabilities(env),
      ...collectProtectedEnvVulnerabilities(env, prepareEnv(inherited)),
      ...vulnerabilityAnalysis(null, [], config),
   ];

   return {
      config,
      vulnerabilities,
   };
}
