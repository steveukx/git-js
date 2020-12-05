import { createFixture } from '../create-fixture';

const stdErr = `
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 5 (delta 2), reused 5 (delta 2), pack-reused 0
`;

export const remoteMessagesObjectEnumeration = createFixture('', stdErr);
