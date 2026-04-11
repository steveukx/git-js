import type { ConfigWrite, ParsedConfigActivity } from '../args/parse-argv.types';
import type { Vulnerability, VulnerabilityCategory } from '../vulnerabilities/vulnerability.types';
import { vulnerabilityAnalysis } from '../vulnerabilities/vulnerability-analysis';

const GitEnvKeys = {
   'editor': 'allowUnsafeEditor',
   'git_askpass': 'allowUnsafeAskPass',
   'git_config_global': 'allowUnsafeConfigPaths',
   'git_config_system': 'allowUnsafeConfigPaths',
   'git_config_count': 'allowUnsafeConfigEnvCount',
   'git_config': 'allowUnsafeConfigPaths',
   'git_editor': 'allowUnsafeEditor',
   'git_exec_path': 'allowUnsafeConfigPaths',
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
} as const satisfies Record<string, VulnerabilityCategory>;

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

function* collectConfigVulnerabilities(env: GitEnv): Generator<Vulnerability> {
   for (const key of Object.keys(env)) {
      if (isGitEnvKey(key)) {
         const category = GitEnvKeys[key];
         yield {
            category,
            message: `Use of "${key.toUpperCase()}" is not permitted without enabling ${category}`,
         };
      }
   }
}

function isGitEnvKey(key: string): key is keyof typeof GitEnvKeys {
   return Object.hasOwn(GitEnvKeys, key);
}

function prepareEnv(env: Record<string, unknown>): GitEnv {
   const gitEnv: GitEnv = {};
   for (const [key, value] of Object.entries(env)) {
      const envKey = key.toLowerCase().trim();
      if (isGitEnvKey(envKey) || envKey.startsWith('git')) {
         gitEnv[envKey] = String(value);
      }
   }
   return gitEnv;
}

export function parseEnv(raw: Record<string, unknown>) {
   const env = prepareEnv(raw);
   const config: ParsedConfigActivity = {
      read: [],
      write: [...collectConfigByCount(env)],
   };
   const vulnerabilities = [
      ...collectConfigVulnerabilities(env),
      ...vulnerabilityAnalysis(null, [], config),
   ];

   return {
      config,
      vulnerabilities,
   };
}
