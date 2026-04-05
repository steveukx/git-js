import { defineConfig } from 'vite';

export function legacyExportFormatPlugin() {
   return {
      name: 'legacy-export-format',
      renderChunk(code: string, chunk: { fileName: string }) {
         if (chunk.fileName.endsWith('.cjs.cjs')) {
            return {
               code: `${code}
Object.defineProperties(
   module.exports = Object.assign(exports.default,exports),
   {
      __esModule: { value: true },
      [Symbol.toStringTag]: { value: 'Module' }
   }
);
`,
               map: null,
            };
         }

         return null;
      },
   };
}

export const baseConfig = (name: string) =>
   defineConfig({
      build: {
         target: 'es2020',
         lib: {
            name,
            entry: './index.ts',
            formats: ['cjs', 'es'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
         },
         outDir: 'dist',
         rollupOptions: {
            external(id) {
               return /^(debug|node:|@kwsites|@simple-git\/)/.test(id);
            },
            plugins: [],
         },
         sourcemap: true,
      },
      test: {
         globals: true,
         environment: 'node',
         include: ['test/**/*.spec.ts'],
      },
   });
