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
