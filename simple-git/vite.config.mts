import { configDefaults, mergeConfig } from 'vitest/config';

import { baseConfig } from '../devtools/vite-config';

export default mergeConfig(baseConfig('simple-git'), {
   test: {
      projects: [
         {
            extends: true,
            test: {
               name: 'unit',
               exclude: [...configDefaults.exclude, 'test/integration/**'],
               setupFiles: ['./test/unit/__mocks__/setup.ts'],
            },
         },
         {
            extends: true,
            test: {
               name: 'integration',
               exclude: [...configDefaults.exclude, 'test/unit/**'],
            },
         },
      ],
   },
});
