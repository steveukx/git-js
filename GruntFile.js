module.exports = function (grunt) {

   'use strict';

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      release: {
         options: {
            file: 'package.json',
            tagName: '<%= version %>', //default: '<%= version %>'
            commitMessage: 'Release <%= version %>', //default: 'release <%= version %>'
            tagMessage: 'Tag version <%= version %>' //default: 'Version <%= version %>'
         }
      }
   });

   grunt.loadNpmTasks('grunt-release-steps');

   require('./build/git.js')(grunt);

   grunt.registerTask('-to-git', ['release:add:commit:push']);
   grunt.registerTask('-tag',    ['release:tag:pushTags']);

   grunt.registerTask('patch', ['release:bump:patch', '-to-git']);
   grunt.registerTask('minor', ['release:bump:minor', '-tag', '-to-git']);
   grunt.registerTask('major', ['release:bump:major', '-tag', '-to-git']);

   grunt.registerTask('default', ['patch']);

};
