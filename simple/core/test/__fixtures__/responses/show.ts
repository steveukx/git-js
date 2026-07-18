import { createFixture } from '../create-fixture';

export function showAbbrevCommitSingleFile() {
   const stdOut = `
commit 2d4d33a
Author: Steve King <steve@mydev.co>
Date:   Sun Oct 11 00:06:10 2015 +0200

    Some commit message

diff --git a/src/file.js b/src/file.js
index ab02a9b..5000197 100644
--- a/src/file.js
+++ b/src/file.js
@@ -468,8 +468,13 @@
existing unchanged content
-        removed content
+        added content
remaining content
`;
   return createFixture(stdOut, '');
}
