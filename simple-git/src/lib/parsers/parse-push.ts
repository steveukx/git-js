import {
   PushDetail,
   PushResult,
   PushResultPushedItem,
   PushResultRemoteMessages,
} from '../../../typings';
import { TaskParser } from '../types';
import { LineParser, parseStringResponse } from '../utils';
import { parseRemoteMessages } from './parse-remote-messages';

function pushResultPushedItem(local: string, remote: string, status: string): PushResultPushedItem {
   const deleted = status.includes('deleted');
   const tag = status.includes('tag') || /^refs\/tags/.test(local);
   const alreadyUpdated = !status.includes('new');

   return {
      deleted,
      tag,
      branch: !tag,
      new: !alreadyUpdated,
      alreadyUpdated,
      local,
      remote,
   };
}

const parsers: LineParser<PushDetail>[] = [
   new LineParser(/^Pushing to (.+)$/, (result, [repo]) => {
      result.repo = repo;
   }),
   new LineParser(/^updating local tracking ref '(.+)'/, (result, [local]) => {
      result.ref = {
         ...(result.ref || {}),
         local,
      };
   }),
   new LineParser(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (result, [local, remote, type]) => {
      result.pushed.push(pushResultPushedItem(local, remote, type));
   }),
   new LineParser(
      /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
      (result, [local, remote, remoteName]) => {
         result.branch = {
            ...(result.branch || {}),
            local,
            remote,
            remoteName,
         };
      }
   ),
   new LineParser(
      /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
      (result, [local, remote, from, to]) => {
         result.update = {
            head: {
               local,
               remote,
            },
            hash: {
               from,
               to,
            },
         };
      }
   ),
];

export const parsePushResult: TaskParser<string, PushResult> = (stdOut, stdErr) => {
   const pushDetail = parsePushDetail(stdOut, stdErr);
   const responseDetail = parseRemoteMessages<PushResultRemoteMessages>(stdOut, stdErr);

   return {
      ...pushDetail,
      ...responseDetail,
   };
};

export const parsePushDetail: TaskParser<string, PushDetail> = (stdOut, stdErr) => {
   return parseStringResponse({ pushed: [] }, parsers, [stdOut, stdErr]);
};
