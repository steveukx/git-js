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

/**
 * Environment variables `git` uses to find the global configuration file (`$HOME/.gitconfig` and
 * `$XDG_CONFIG_HOME/git/config`). These are needed by almost every process, so unlike `GitEnvKeys`
 * they are never removed from an inherited environment, and are only treated as a vulnerability
 * when supplied with a value that differs from the inherited one.
 */
const ConfigHomeEnvKeys = {
   'home': 'allowUnsafeConfigPaths',
   'xdg_config_home': 'allowUnsafeConfigPaths',
} as const satisfies Record<string, VulnerabilityCategory>;

function isConfigHomeEnvKey(key: string): key is keyof typeof ConfigHomeEnvKeys {
   return Object.hasOwn(ConfigHomeEnvKeys, key);
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

function* collectConfigHomeVulnerabilities(
   env: GitEnv,
   inherited: GitEnv
): Generator<Vulnerability> {
   for (const key of Object.keys(env)) {
      if (isConfigHomeEnvKey(key) && env[key] !== inherited[key]) {
         const category = ConfigHomeEnvKeys[key];
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

function prepareEnv(env: Record<string, unknown>): GitEnv {
   const gitEnv: GitEnv = {};
   for (const [key, value] of Object.entries(env)) {
      const envKey = key.toLowerCase().trim();
      if (isGitEnvKey(envKey) || isConfigHomeEnvKey(envKey) || envKey.startsWith('git')) {
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
      ...collectConfigHomeVulnerabilities(env, prepareEnv(inherited)),
      ...vulnerabilityAnalysis(null, [], config),
   ];

   return {
      config,
      vulnerabilities,
   };
}
