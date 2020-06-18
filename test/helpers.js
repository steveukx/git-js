import { NOOP } from "../src/lib/utils";

module.exports.autoMergeFile = (fileName = 'pass.txt') => {
   return `
Auto-merging ${ fileName }`;
};

module.exports.autoMergeConflict = (fileName = 'fail.txt', reason = 'content') => {
   return `
Auto-merging ${ fileName }
CONFLICT (content): Merge conflict in ${ fileName }`;
}

module.exports.autoMergeResponse = (...responses) => {
   let response = responses.map(r => typeof r === 'function' ? r() : String(r)).join('');
   if (/^CONFLICT/.test(response)) {
      response += `\nAutomatic merge failed; fix conflicts and then commit the result.`;
   }

   return response;
}

module.exports.setUpConflicted = async function (git, context) {
   await git.init();
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
};

module.exports.createSingleConflict = async function (git, context) {
   await git.checkout('first');
   await context.fileP('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return 'second';
};

module.exports.createTestContext = function () {
   const {join} = require('path');
   const {existsSync, mkdirSync, mkdtempSync, realpathSync, writeFile, writeFileSync} = require('fs');

   const context = {
      dir (path) {
         const dir = join(context.root, path);
         if (!existsSync(dir)) {
            mkdirSync(dir);
         }

         return dir;
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
      deferred () {
         let d = {};
         d.promise = new Promise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
         });

         return d;
      }
   };

   return context;
};

module.exports.mockDebugModule = (function mockDebugModule () {

   process.env.DEBUG_COLORS = false;

   const output = [];
   const debug = jest.requireActual('debug');
   const {enable, disable} = debug;

   const $merge = (message) => {
      let index = 1;
      return message[0] && message[0].replace(/%[A-Z]/gi, () => String(message[index++]));
   }

   debug.log = (format, ...tokens) => {
      const [time, namespace, ...messages] = format.split(' ');
      const message = messages.join(' ');
      output.push({ time, namespace, message, merged: $merge([message, ...tokens]), });
   };

   jest.spyOn(debug, 'enable');
   jest.spyOn(debug, 'disable');

   debug.$setup = (enabled) => {
      if (!enabled) {
         disable.call(debug);
      } else {
         enable.call(debug, enabled);
      }

      debug.enable.mockReset();
      debug.disable.mockReset();
   };

   debug.$logged = () => output.reduce((all, {namespace, message, merged}) => {
      (all[namespace] = all[namespace] || {
         get count () {
            return this.messages.length;
         },
         merged: [],
         messages: [],
         toString () {
            return this.messages.join('\n');
         },
         $add (_message, _merged) {
            this.messages.push(_message);
            this.merged.push(_merged);
         }
      }).$add(message, merged);
      return all;
   }, {});

   debug.$output = (namespace) => {
      return output.filter(entry => {
         return !namespace || entry.namespace === namespace;
      });
   };

   debug.$reset = () => {
      output.length = 0;
      debug.$setup();
   };

   debug.$setup();

   return debug;

}());
