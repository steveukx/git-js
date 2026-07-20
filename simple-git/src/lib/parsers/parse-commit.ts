import { CommitResult } from '../../../typings';
import { LineParser, parseStringResponse } from '../utils';

const parsers: LineParser<CommitResult>[] = [
   new LineParser(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (result, [branch, root, commit]) => {
      result.branch = branch;
      result.commit = commit;
      result.root = !!root;
   }),
   new LineParser(/\s*Author:\s(.+)/i, (result, [author]) => {
      const parts = author.split('<');
      const email = parts.pop();

      if (!email || !email.includes('@')) {
         return;
      }

      result.author = {
         email: email.substr(0, email.length - 1),
         name: parts.join('<').trim(),
      };
   }),
   new LineParser(
      /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
      (result, [changes, insertions, deletions]) => {
         result.summary.changes = parseInt(changes, 10) || 0;
         result.summary.insertions = parseInt(insertions, 10) || 0;
         result.summary.deletions = parseInt(deletions, 10) || 0;
      }
   ),
   new LineParser(
      /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
      (result, [changes, lines, direction]) => {
         result.summary.changes = parseInt(changes, 10) || 0;
         const count = parseInt(lines, 10) || 0;
         if (direction === '-') {
            result.summary.deletions = count;
         } else if (direction === '+') {
            result.summary.insertions = count;
         }
      }
   ),
];

/**
 * Extrahiert Git Trailer aus der Commit-Nachricht
 * @param body - Vollständige Commit-Nachricht
 * @returns Key-Value Objekt aller Trailer
 */
export function parseTrailers(body: string): Record<string, string> {
   if (!body) return {};

   const trailers: Record<string, string> = {};
   const lines = body.split('\n');
   let inTrailerSection = false;

   // Von hinten durchgehen
   for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      // Wenn leere Zeile oder ---, dann sind wir im Trailer-Bereich
      if (line.trim() === '' || line.trim() === '---') {
         inTrailerSection = true;
         continue;
      }
      
      if (inTrailerSection) {
         // Prüfe auf "Key: Value" Format
         const match = line.match(/^([^:]+):\s*(.+)$/);
         if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            trailers[key] = value;
         } else {
            // Wenn kein Trailer-Format, sind wir fertig
            break;
         }
      }
   }
   
   return trailers;
}

export function parseCommitResult(stdOut: string): CommitResult {
   const result: CommitResult = {
      author: null,
      branch: '',
      commit: '',
      root: false,
      summary: {
         changes: 0,
         insertions: 0,
         deletions: 0,
      },
   };
   
   // Parse die Standard-Felder
   const parsedResult = parseStringResponse(result, parsers, stdOut);
   
   // Extrahiere die Commit-Nachricht
   const lines = stdOut.split('\n');
   let body = '';
   let inBody = false;
   
   for (const line of lines) {
      if (line.startsWith('    ')) {
         inBody = true;
         body += line.trim() + '\n';
      } else if (inBody && line.trim() === '') {
         break;
      }
   }
   
   // Füge trailers zum Ergebnis hinzu
   const trailers = parseTrailers(body.trim());
   if (Object.keys(trailers).length > 0) {
      parsedResult.trailers = trailers;
   }
   
   return parsedResult;
}