
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const {parseGetRemotesVerbose} = require('../../src/lib/responses/GetRemoteSummary');

describe('remotes', ( )=> {

   let git;

   beforeEach(() => {
      restore();
      git = Instance();
   });

   afterEach(() => restore());

   describe('getRemotes', () => {
      it('list remotes when there are none set up', () => new Promise(done => {
         git.getRemotes((err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual([]);

            done();
         });

         closeWith('');
      }));

      it('get list', () => new Promise(done => {
         git.getRemotes(function (err, result) {
            expect(theCommandRun()).toEqual(['remote']);
            expect(err).toBeNull();
            expect(result).toEqual([
               {name: 'origin'},
               {name: 'upstream'},
            ]);

            done();
         });

         closeWith(`
        origin
        upstream
        `);
      }));

      it('get verbose list', () => new Promise(done => {
         git.getRemotes(true, function (err, result) {
            expect(theCommandRun()).toEqual(['remote', '-v']);
            expect(err).toBeNull();
            expect(result).toEqual([
               {name: 'origin', refs: {fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git'}},
               {name: 'upstream', refs: {fetch: 's://u@d.com/another/repo.git', push: 's://u@d.com/another/repo.git'}},
            ]);
            done();
         });

         closeWith(`
        origin    s://u@d.com/u/repo.git (fetch)
        origin    s://u@d.com/u/repo.git (push)
        upstream  s://u@d.com/another/repo.git (fetch)
        upstream  s://u@d.com/another/repo.git (push)
        `);
      }));

      it('parses a verbose response', () => {
         const actual = parseGetRemotesVerbose(`
        origin    s://u@d.com/u/repo.git (fetch)
        origin    s://u@d.com/u/repo.git (push)
        upstream  s://u@d.com/another/repo.git (fetch)
        upstream  s://u@d.com/another/repo.git (push)
        `);

         expect(actual).toEqual([
            {name: 'origin', refs: {fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git'}},
            {name: 'upstream', refs: {fetch: 's://u@d.com/another/repo.git', push: 's://u@d.com/another/repo.git'}},
         ]);
      });

      it('parses a verbose response with separate fetch and push', () => {
         const actual = parseGetRemotesVerbose(`
        origin    s://anonymous.com/repo.git (fetch)
        origin    s://u@d.com/u/repo.git (push)
        `);

         expect(actual).toEqual([
            {name: 'origin', refs: {fetch: 's://anonymous.com/repo.git', push: 's://u@d.com/u/repo.git'}},
         ]);
      });
   });

   describe('addRemote', () => {

      it('adds by name and repo', () => new Promise(done => {
         git.addRemote('repo-name', 'remote-repo', (err) => {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['remote', 'add', 'repo-name', 'remote-repo']);
            done();
         });

         closeWith('');
      }));

      it('adds by name and repo with options object', () => new Promise(done => {
         git.addRemote('repo-name', 'remote-repo', { '-f': null }, (err) => {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['remote', 'add', '-f', 'repo-name', 'remote-repo']);
            done();
         });

         closeWith('');
      }));

      it('adds by name and repo with options array', () => new Promise(done => {
         git.addRemote('repo-name', 'remote-repo', ['-f'], (err) => {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['remote', 'add', '-f', 'repo-name', 'remote-repo']);
            done();
         });

         closeWith('');
      }));

   });

});
