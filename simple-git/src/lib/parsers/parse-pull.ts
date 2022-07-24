import { PullDetail, PullFailedResult, PullResult, RemoteMessages } from '../../../typings';
import { PullFailedSummary, PullSummary } from '../responses/PullSummary';
import { TaskParser } from '../types';
import { append, LineParser, parseStringResponse } from '../utils';
import { parseRemoteMessages } from './parse-remote-messages';

const FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/;
const SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/;
const ACTION_REGEX = /^(create|delete) mode \d+ (.+)/;

const parsers: LineParser<PullResult>[] = [
   new LineParser(FILE_UPDATE_REGEX, (result, [file, insertions, deletions]) => {
      result.files.push(file);

      if (insertions) {
         result.insertions[file] = insertions.length;
      }

      if (deletions) {
         result.deletions[file] = deletions.length;
      }
   }),
   new LineParser(SUMMARY_REGEX, (result, [changes, , insertions, , deletions]) => {
      if (insertions !== undefined || deletions !== undefined) {
         result.summary.changes = +changes || 0;
         result.summary.insertions = +insertions || 0;
         result.summary.deletions = +deletions || 0;
         return true;
      }
      return false;
   }),
   new LineParser(ACTION_REGEX, (result, [action, file]) => {
      append(result.files, file);
      append(action === 'create' ? result.created : result.deleted, file);
   }),
];

const errorParsers: LineParser<PullFailedResult>[] = [
   new LineParser(/^from\s(.+)$/i, (result, [remote]) => void (result.remote = remote)),
   new LineParser(/^fatal:\s(.+)$/, (result, [message]) => void (result.message = message)),
   new LineParser(
      /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
      (result, [hashLocal, hashRemote, branchLocal, branchRemote]) => {
         result.branch.local = branchLocal;
         result.hash.local = hashLocal;
         result.branch.remote = branchRemote;
         result.hash.remote = hashRemote;
      }
   ),
];

export const parsePullDetail: TaskParser<string, PullDetail> = (stdOut, stdErr) => {
   return parseStringResponse(new PullSummary(), parsers, [stdOut, stdErr]);
};

export const parsePullResult: TaskParser<string, PullResult> = (stdOut, stdErr) => {
   return Object.assign(
      new PullSummary(),
      parsePullDetail(stdOut, stdErr),
      parseRemoteMessages<RemoteMessages>(stdOut, stdErr)
   );
};

export function parsePullErrorResult(stdOut: string, stdErr: string) {
   const pullError = parseStringResponse(new PullFailedSummary(), errorParsers, [stdOut, stdErr]);

   return pullError.message && pullError;
}
