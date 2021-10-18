## Git Grep

The official documentation for [git grep](https://git-scm.com/docs/git-grep) gives the full set of options that can be passed to the `simple-git` `git.grep` method as [options](../readme.md#how-to-specify-options) (note that `-h` to hide the file name is disallowed).

The simplest version is to search with a single search token:

```typescript
import simpleGit from 'simple-git';

console.log(await simpleGit().grep('search-term'));
```

To search with multiple terms, use the `grepQueryBuilder` helper to construct the remaining arguments:

```typescript
import simpleGit, { grepQueryBuilder } from 'simple-git';

// logs all files that contain `aaa` AND either `bbb` or `ccc`
console.log(
    await simpleGit().grep(grepQueryBuilder('aaa').and('bbb', 'ccc'))
);
```

The builder interface is purely there to simplify the many `-e` flags needed to instruct `git` to treat an argument as a search term - the code above translates to:

```typescript
console.log(Array.from(grepQueryBuilder('aaa').and('bbb', 'ccc')))
    // [ '-e', 'aaa', '--and', '(', '-e', 'bbb', '-e', 'ccc', ')' ]
```

To build your own query instead of using the `grepQueryBuilder`, use the array form of [options](../readme.md#how-to-specify-options):

```typescript
import simpleGit from 'simple-git';

console.log(await simpleGit().grep('search-term', ['-e', 'another search term']));
```

`git.grep` will include previews around the matched term in the resulting data, to disable this use options such as `-l` to only show the file name or `-c` to show the number of instances of a match in the file rather than the text that was matched.

