import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
   resolve: {
      alias: {
         '@': resolve(__dirname, 'src'),
      },
   },
   build: {
      target: 'es2020',
      sourcemap: true,
      lib: {
         name: 'simple-git',
         entry: resolve(__dirname, 'src/index.ts'),
         formats: ['es', 'cjs', 'umd'],
         fileName(format) {
            const suffix = format === 'es' ? 'mjs' : 'cjs';
            return `index.${format}.${suffix}`;
         },
      },
      outDir: 'dist',
      rollupOptions: {
         external(id) {
            return /^(debug|node:|@kwsites\/)/.test(id);
         },
         plugins: [legacyExportFormat()],
      },
      // emptyOutDir: true,
   },
   // test: {
   //    globals: true,
   //    environment: 'node',
   // },
});

function legacyExportFormat() {
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
