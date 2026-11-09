import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as ts from 'typescript';

/**
 * Runs code examples from the markdown files in the repository's `docs` folder, so the
 * examples can't drift from what the library really does.
 *
 * An example is a fenced `typescript` code block preceded by an HTML comment marker:
 *
 *    <!-- doc-test: some/unique-id -->
 *    ```typescript
 *    import { simpleGit } from 'simple-git';
 *    await simpleGit().status();
 *    ```
 *
 * The only import an example may use is `simpleGit` from `simple-git`. When run, `simpleGit`
 * is replaced with a factory bound to the test's own repository.
 */

const DOCS_ROOT = join(__dirname, '..', '..', '..', '..', 'docs');

const MARKER = /^<!--\s*doc-test:\s*([\w/.-]+)\s*-->\s*$/;
const FENCE_OPEN = /^```(\w*)\s*$/;
const FENCE_CLOSE = /^```\s*$/;
const SIMPLE_GIT_IMPORT = /^import\s+\{\s*simpleGit\s*\}\s+from\s+['"]simple-git['"];?\s*$/;

export interface DocExample {
   id: string;
   code: string;
}

export interface DocSection {
   /** Marked examples, in the order they appear */
   examples: DocExample[];

   /** The first line of every code block in the section that has no `doc-test` marker */
   unmarked: string[];
}

/**
 * Reads the section of `docs/<file>` under the heading whose text is `heading`, up to the next
 * heading of the same or a higher level.
 */
export function readDocSection(file: string, heading: string): DocSection {
   const lines = readFileSync(join(DOCS_ROOT, file), 'utf-8').split('\n');
   const start = lines.findIndex(
      (line) => /^#+\s/.test(line) && line.replace(/^#+\s+/, '') === heading
   );
   if (start < 0) {
      throw new Error(`docs/${file} has no heading "${heading}"`);
   }

   const level = lines[start].indexOf(' ');
   const examples: DocExample[] = [];
   const unmarked: string[] = [];
   let pendingId: string | undefined;

   for (let index = start + 1; index < lines.length; index++) {
      const line = lines[index];
      const headingLevel = /^(#+)\s/.exec(line)?.[1].length;
      if (headingLevel !== undefined && headingLevel <= level) {
         break;
      }

      const marker = MARKER.exec(line);
      if (marker) {
         pendingId = marker[1];
         continue;
      }

      if (FENCE_OPEN.test(line)) {
         const body: string[] = [];
         for (index++; index < lines.length && !FENCE_CLOSE.test(lines[index]); index++) {
            body.push(lines[index]);
         }

         if (pendingId === undefined) {
            unmarked.push(body.find((text) => text.trim()) ?? '(empty code block)');
         } else {
            examples.push({ id: pendingId, code: body.join('\n') });
         }
         pendingId = undefined;
         continue;
      }

      if (line.trim()) {
         pendingId = undefined;
      }
   }

   return { examples, unmarked };
}

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
   ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

/**
 * Runs the code of an example, with `simpleGit` replaced by the supplied factory.
 */
export async function runDocExample(example: DocExample, simpleGit: unknown) {
   const body = example.code
      .split('\n')
      .filter((line) => !SIMPLE_GIT_IMPORT.test(line))
      .join('\n');

   if (/^\s*import\s/m.test(body)) {
      throw new Error(
         `doc-test ${example.id} can only import simpleGit from 'simple-git', other imports aren't supported`
      );
   }

   const { outputText } = ts.transpileModule(body, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
   });

   await new AsyncFunction('simpleGit', outputText)(simpleGit);
}
