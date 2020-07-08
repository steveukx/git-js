const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');

describe('submodule', () => {

   let git;

   beforeEach(() => {
      restore();
      git = Instance();
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
         closeWith('');
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

         closeWith('');
      }));

      it('update with string arg', () => new Promise(done => {
         git.submoduleUpdate('foo', function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "update", 'foo']);
            done();
         });

         closeWith('');
      }));

      it('update with array arg', () => new Promise(done => {
         git.submoduleUpdate(['foo', 'bar'], function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "update", 'foo', 'bar']);
            done();
         });

         closeWith('');
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

         closeWith('');
      }));

      it('init with string arg', () => new Promise(done => {
         git.submoduleInit('foo', function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "init", "foo"]);
            done();
         });

         closeWith('');
      }));

      it('init with array arg', () => new Promise(done => {
         git.submoduleInit(['foo', 'bar'], function (err, result) {
            expect(err).toBeNull();
            expect(result).toBe('');
            expect(theCommandRun()).toEqual(["submodule", "init", "foo", "bar"]);
            done();
         });

         closeWith('');
      }));
   });

});
