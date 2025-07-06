import { createFixture } from '../create-fixture';
import { NULL } from '../../../../src/lib/utils';

export function stagedRenamed(from = 'from.ext', to = 'to.ext', workingDir = ' ') {
   return `R${workingDir} ${to}${NULL}${from}`;
}

export function stagedRenamedWithModifications(from = 'from.ext', to = 'to.ext') {
   return stagedRenamed(from, to, 'M');
}

export function stagedDeleted(file = 'staged-deleted.ext') {
   return `D  ${file}`;
}

export function unStagedDeleted(file = 'un-staged-deleted.ext') {
   return ` D ${file}`;
}

export function stagedModified(file = 'staged-modified.ext') {
   return `M  ${file}`;
}

export function stagedIgnored(file = 'ignored.ext') {
   return `!! ${file}`;
}

export function statusResponse(branch = 'main', ...files: Array<string | (() => string)>) {
   const stdOut: string[] = [
      `## ${branch}`,
      ...files.map((file) => (typeof file === 'function' ? file() : file)),
   ];

   return createFixture(stdOut.join(NULL), '');
}
