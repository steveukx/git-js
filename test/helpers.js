Object.assign(module.exports, {
   configureGitCommitter,
   createSingleConflict,

   setUpConflicted,
   setUpFilesAdded,
   setUpFilesCreated,
   setUpGitIgnore,
   setUpInit,
});

async function setUpConflicted (context) {
   await setUpInit(context);
   const git = context.git(context.root);
   await git.checkout(['-b', 'first']);

   await context.fileP('aaa.txt', 'Some\nFile content\nhere');
   await context.fileP('bbb.txt', Array.from({length: 20}, () => 'bbb').join('\n'));

   await git.add(`*.txt`);
   await git.commit('first commit');
   await git.checkout(['-b', 'second', 'first']);

   await context.fileP('aaa.txt', 'Different\nFile content\nhere');
   await context.fileP('ccc.txt', 'Another file');

   await git.add(`*.txt`);
   await git.commit('second commit');
}

async function setUpGitIgnore (context, ignored = 'ignored.*\n') {
   await context.fileP('.gitignore', ignored);

   const git = context.git(context.root);
   await git.add('.gitignore');
   await git.commit('Add ignore');
}

async function createSingleConflict (context) {
   const git = context.git(context.root);
   await git.checkout('first');
   await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return 'second';
}


