import { closeWithError, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { mockChildProcessModule } from './__mocks__/mock-child-process';

jest.mock('child_process', () => mockChildProcessModule);

describe('logging', () => {

   const {enable, $debugEnvironmentVariable, $enabled, $logged} = require('debug');

   beforeEach(() => {
      $debugEnvironmentVariable('*');
      $enabled(true);
   });

   it('logs task errors to main log as well as the detailed log', async () => {
      newSimpleGit().init();
      await closeWithError('Something bad');

      const logged = $logged(/^simple-git$/, /^simple-git:task:*/);
      expect(Object.keys(logged)).toEqual([
         'simple-git',
         'simple-git:task:init:1',
      ]);
   });

   it('logs task detail by wild-card', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect(Object.keys($logged(/simple-git:task:/))).toEqual([
         'simple-git:task:init:1',
         'simple-git:task:clean:2',
      ]);
   });

   it('logs task detail by type', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect(Object.keys($logged(/task:clean/))).toEqual([
         'simple-git:task:clean:2',
      ]);
   });

   it('logs task response by wild-card', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess('Initialised');
      await closeWithSuccess('Removing foo/');

      const logged = $logged(/output/);
      expect(Object.keys(logged)).toHaveLength(2);
      expect(logged['simple-git:output:init:1'].toString()).toMatch('Initialised');
      expect(logged['simple-git:output:clean:2'].toString()).toMatch('Removing foo/');
   });

   it('logs task response by type', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      const logged = $logged(/output:clean/);
      expect(Object.keys(logged)).toHaveLength(1);
      expect(logged['simple-git:output:clean:2'].toString()).toMatch('Removing foo/');
   });

   it('when logging is wild-card enabled, silent disables the namespace', async () => {
      newSimpleGit().silent(true);
      expect(enable).toHaveBeenCalledWith('*,-simple-git');
   });

   it('when logging is wild-card enabled, non-silent does nothing', async () => {
      newSimpleGit().silent(false);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly enabled, silent removes the namespace', async () => {
      $debugEnvironmentVariable('another,simple-git,other');
      newSimpleGit().silent(true);
      expect(enable).toHaveBeenCalledWith('another,other');
   });

   it('when logging is explicitly enabled, non-silent does nothing', async () => {
      $debugEnvironmentVariable('another,simple-git,other');
      newSimpleGit().silent(false);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly disabled, silent does nothing', async () => {
      $debugEnvironmentVariable('*,-simple-git,-other');
      $enabled(false);
      newSimpleGit().silent(true);
      expect(enable).not.toHaveBeenCalled();
   });

   it('when logging is explicitly disabled, non-silent does nothing', async () => {
      $debugEnvironmentVariable('*,-simple-git,-other');
      $enabled(false);
      newSimpleGit().silent(false);
      expect(enable).toHaveBeenCalledWith('*,-other');
   });

});
