import {
   gitHubAlertsUrl,
   gitHubPullRequest,
   gitLabPullRequest,
   pushNewBranch,
   pushNewBranchWithVulnerabilities,
} from './__fixtures__/push';
import { like, remoteMessagesObjectEnumeration } from './__fixtures__';
import { parseRemoteMessages } from '../../src/lib/parsers/parse-remote-messages';

describe('remote-messages', () => {
   it('detects object enumeration', () => {
      const actual = parseRemoteMessages(...remoteMessagesObjectEnumeration.parserArgs);
      expect(actual).toEqual(
         like({
            remoteMessages: {
               all: [
                  'Enumerating objects: 5, done.',
                  'Counting objects: 100% (5/5), done.',
                  'Compressing objects: 100% (3/3), done.',
                  'Total 5 (delta 2), reused 5 (delta 2), pack-reused 0',
               ],
               objects: {
                  enumerating: 5,
                  counting: 5,
                  compressing: 3,
                  total: {
                     count: 5,
                     delta: 2,
                  },
                  reused: {
                     count: 5,
                     delta: 2,
                  },
                  packReused: 0,
               },
            },
         })
      );
   });

   it('outputs all remote messages whether they are parsed or not', () => {
      const actual = parseRemoteMessages(...pushNewBranch.parserArgs);

      expect(actual).toEqual(
         like({
            remoteMessages: {
               all: [
                  'To create a merge request for new-branch-name-here, visit:',
                  gitLabPullRequest,
               ],
               pullRequestUrl: gitLabPullRequest,
            },
         })
      );
   });

   it('parses github reports of vulnerabilities', () => {
      const actual = parseRemoteMessages(...pushNewBranchWithVulnerabilities.parserArgs);

      expect(actual.remoteMessages.all).toHaveLength(4);
      expect(actual).toEqual(
         like({
            remoteMessages: like({
               pullRequestUrl: gitHubPullRequest,
               vulnerabilities: {
                  count: 12,
                  summary: '12 moderate',
                  url: gitHubAlertsUrl,
               },
            }),
         })
      );
   });

   it('parses github pull request', () => {
      const actual = parseRemoteMessages(...pushNewBranch.parserArgs);

      expect(actual).toEqual({
         remoteMessages: like({
            pullRequestUrl:
               'https://gitlab/kwsites/mock-repo/-/merge_requests/new?merge_request%5Bsource_branch%5D=new-branch-name-here',
         }),
      });
   });
});
