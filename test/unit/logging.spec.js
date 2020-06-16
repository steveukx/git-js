const { restore, newSimpleGit, closeWithError, closeWithSuccess } = require('./include/setup');

describe('logging', () => {

   const { enable, $setup, $logged } = require('debug');

   afterEach(() => restore());

   it('logs task errors to main log as well as the detailed log', async () => {
      $setup('simple-git,simple-git:task:*');
      newSimpleGit().init();
      await closeWithError('Something bad');

      const logged = $logged();
      expect(Object.keys(logged)).toEqual([
         'simple-git:task:init:1',
         'simple-git',
      ]);
   });

   it('logs task detail by wild-card', async () => {
      $setup('simple-git:task:*');
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect(Object.keys($logged())).toEqual([
         'simple-git:task:init:1',
         'simple-git:task:clean:2',
      ]);
   });

   it('logs task detail by type', async () => {
      $setup('simple-git:task:clean:*');
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect(Object.keys($logged())).toEqual([
         'simple-git:task:clean:2',
      ]);
   });

   it('logs task response by wild-card', async () => {
      $setup('simple-git:output:*');
      newSimpleGit().init().clean('f');
      await closeWithSuccess('Initialised');
      await closeWithSuccess('Removing foo/');

      const logged = $logged();
      expect(Object.keys(logged)).toHaveLength(2);
      expect(logged['simple-git:output:init:1'].toString()).toMatch('Initialised');
      expect(logged['simple-git:output:clean:2'].toString()).toMatch('Removing foo/');
   });

   it('logs task response by type', async () => {
      $setup('simple-git:output:clean:*');
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      const logged = $logged();
      expect(Object.keys(logged)).toHaveLength(1);
      expect(logged['simple-git:output:clean:2'].toString()).toMatch('Removing foo/');
   });

   it('when logging is wild-card enabled, silent disables the namespace', async () => {
      $setup('*');
      newSimpleGit().silent(true);
      expect(enable).toHaveBeenCalledWith('*,-simple-git');
   });

   it('when logging is wild-card enabled, non-silent does nothing', async () => {
      $setup('*');
      newSimpleGit().silent(false);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly enabled, silent removes the namespace', async () => {
      $setup('another,simple-git,other');
      newSimpleGit().silent(true);
      expect(enable).toHaveBeenCalledWith('another,other');
   });

   it('when logging is explicitly enabled, non-silent does nothing', async () => {
      $setup('another,simple-git,other');
      newSimpleGit().silent(false);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly disabled, silent does nothing', async () => {
      $setup('*,-simple-git,-other');
      newSimpleGit().silent(true);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly enabled, non-silent does nothing', async () => {
      $setup('*,-simple-git,-other');
      newSimpleGit().silent(false);
      expect(enable).toHaveBeenCalledWith('*,-other');
   });


})
