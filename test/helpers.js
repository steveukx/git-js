Object.assign(module.exports, {
   configureGitCommitter,
   createSingleConflict,
   createTestContext,

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

async function setUpFilesAdded (context, fileNames, addSelector = '.', message = 'Create files') {
   await setUpFilesCreated(context, fileNames);

   const git = context.git(context.root);
   await git.add(addSelector);
   await git.commit(message);
}

async function setUpFilesCreated (context, fileNames) {
   await Promise.all(fileNames.map(name => context.fileP(name, `${ name }\n${ name }`)));
}

async function setUpGitIgnore (context, ignored = 'ignored.*\n') {
   await context.fileP('.gitignore', ignored);

   const git = context.git(context.root);
   await git.add('.gitignore');
   await git.commit('Add ignore');
}

async function setUpInit (context, bare = false) {
   await context.git(context.root).init(bare);
   await configureGitCommitter(context);
}

async function createSingleConflict (context) {
   const git = context.git(context.root);
   await git.checkout('first');
   await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return 'second';
}

async function configureGitCommitter (context, name = 'Simple Git Tests', email = 'tests@simple-git.dev') {
   const git = context.git(context.root);
   await git.addConfig('user.name', name);
   await git.addConfig('user.email', email);
}

function createTestContext () {
   const {join} = require('path');
   const {existsSync, mkdirSync, mkdtempSync, realpathSync, writeFile, writeFileSync} = require('fs');

   require('@kwsites/file-exists').$real(true);

   const context = {
      dir (...paths) {
         if (!paths.length) {
            return context.root;
         }

         const dir = join(context.root, ...paths);
         if (!existsSync(dir)) {
            mkdirSync(dir);
         }

         return dir;
      },
      dirPath (...dirs) {
         return join(context.root, ...dirs);
      },
      fileP (dir, path, content) {
         if (arguments.length === 2) {
            return context.fileP(undefined, dir, path);
         }

         return new Promise((ok, fail) => {
            const file = join(dir ? context.dir(dir) : context.root, path);
            writeFile(file, content, (err) => err ? fail(err) : ok(file));
         });
      },
      file (dir, path, content) {
         const file = join(dir ? context.dir(dir) : context.root, path);
         writeFileSync(file, content, 'utf8');

         return file;
      },
      filePath (dir, path) {
         return join(context.dir(dir), path);
      },
      root: mkdtempSync((process.env.TMPDIR || '/tmp/') + 'simple-git-test-'),
      get rootResolvedPath () {
         return realpathSync(context.root);
      },
      git: require('../'),
      gitP: require('../promise'),
   };

   return context;
}


