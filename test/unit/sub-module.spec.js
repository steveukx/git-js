import { newSimpleGit } from "./__fixtures__";

const {theCommandRun, closeWithSuccess, restore} = require('./include/setup');

describe('submodule', () => {

   let git;

   beforeEach(() => {
      restore();
      git = newSimpleGit();
   });

   afterEach(() => restore());

   describe('add', () => {

      it('adds a named sub module', () => new Promise(done => {
         git.submoduleAdd('my_repo', 'at_path', (err, result) => {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(['submodule', 'add', 'my_repo', 'at_path']);
            done();
         });
         closeWithSuccess();
      }));


   });

   describe('update', () => {

      it('update with no args', () => new Promise(done => {
         git.submoduleUpdate(function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "update"]);
            done();
         });

         closeWithSuccess();
      }));

      it('update with string arg', () => new Promise(done => {
         git.submoduleUpdate('foo', function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "update", 'foo']);
            done();
         });

         closeWithSuccess();
      }));

      it('update with array arg', () => new Promise(done => {
         git.submoduleUpdate(['foo', 'bar'], function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "update", 'foo', 'bar']);
            done();
         });

         closeWithSuccess();
      }));
   });

   describe('init', () => {
      it('init with no args', () => new Promise(done => {
         git.submoduleInit(function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "init"]);
            done();
         });

         closeWithSuccess();
      }));

      it('init with string arg', () => new Promise(done => {
         git.submoduleInit('foo', function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "init", "foo"]);
            done();
         });

         closeWithSuccess();
      }));

      it('init with array arg', () => new Promise(done => {
         git.submoduleInit(['foo', 'bar'], function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "init", "foo", "bar"]);
            done();
         });

         closeWithSuccess();
      }));
   });

});
