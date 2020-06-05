const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const {configListParser} = require('../../src/lib/responses/ConfigList');

describe ('config list parser', () => {

   const NULL = '\0';
   const GLOBAL_FILE = '/Library/Developer/CommandLineTools/usr/share/git-core/gitconfig';
   const USER_FILE = '/Users/whoami/.gitconfig';

   it('parses global config', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'def', 'global-value-def'),
      ));

      expect(config.files).toEqual([GLOBAL_FILE]);
      expect(config.all).toEqual({abc: 'global-value-abc', def: 'global-value-def'});
   });

   it('parses global and user config', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'def', 'global-value-def'),
         listConfigLine(USER_FILE, 'abc', 'user-value-abc'),
      ));

      expect(config.files).toEqual([GLOBAL_FILE, USER_FILE]);
      expect(config.all).toEqual({abc: 'user-value-abc', def: 'global-value-def'});
   });

   it('parses multiple values', () => {
      const config = configListParser(listConfigFile(
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-abc'),
         listConfigLine(GLOBAL_FILE, 'abc', 'global-value-def'),
      ));

      expect(config.all).toEqual({abc: ['global-value-abc', 'global-value-def']});
   });

   function listConfigLine (file, key, value) {
      return `file:${file}${NULL}${key}\n${value}`;
   }

   function listConfigFile (...lines) {
      return lines.join(NULL);
   }
});

describe('config', () => {

   let git;

   beforeEach(() => {
      restore();
      git = Instance();
   });

   afterEach(() => restore());

   it('adds', () => new Promise(done => {
      git.addConfig('user.name', 'test', function (err, result) {
         expect(err).toBeNull();
         expect(theCommandRun()).toEqual(['config', '--local', 'user.name', 'test']);
         done();
      });

      closeWith('');
   }));

   it('appends', () => new Promise(done => {
      git.addConfig('user.name', 'test', true, function (err, result) {
         expect(err).toBeNull();
         expect(theCommandRun()).toEqual(['config', '--local', '--add', 'user.name', 'test']);
         done();
      });

      closeWith('');
   }));

});
