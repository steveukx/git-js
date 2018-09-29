
export interface GitConfig {
   baseDir?: string;
   env?: {[key: string]: string | number | boolean}
}

export interface GitChainProcessor {

}

const defaults: GitConfig = {
   baseDir: process.cwd()
};

export default function git (options: GitConfig) {

   function pipe(...pipes: GitChainProcessor[]) {

   }

   return {pipe};

}
