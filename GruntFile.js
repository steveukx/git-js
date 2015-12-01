module.exports = function (grunt) {

   'use strict';

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      nodeunit: {
         all: ['test/test*.js']
      },

      release: {
         options: {
            file: 'package.json',
            tagName: '<%= version %>', //default: '<%= version %>'
            commitMessage: 'Release <%= version %>', //default: 'release <%= version %>'
            tagMessage: 'Tag version <%= version %>' //default: 'Version <%= version %>'
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-nodeunit');
   grunt.loadNpmTasks('grunt-release-steps');

   grunt.registerTask('-to-npm', ['release:npm']);
   grunt.registerTask('-to-git', ['release:add:commit:push']);
   grunt.registerTask('-tag',    ['release:tag:pushTags']);

   grunt.registerTask('patch', ['test', 'release:bump:patch', '-to-git']);
   grunt.registerTask('minor', ['test', 'release:bump:minor', '-tag', '-to-git', '-to-npm']);
   grunt.registerTask('major', ['test', 'release:bump:major', '-tag', '-to-git', '-to-npm']);

   grunt.registerTask('default', ['patch']);
   grunt.registerTask('test', ['nodeunit:all']);

};
