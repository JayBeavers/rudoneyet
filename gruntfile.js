'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['*.js', 'routes/*.js', 'modules/*.js', 'models/*.js'],
      options: {
        globalstrict: false,
        node: true,
        browser: true,
        esnext: true
      }
    },

    watch: {
      express: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'express:dev'],
        options: {
          spawn: false
        }
      }
    },

    'node-inspector': {
      dev: {
        'hidden': ['node_modules']
      }
    },

    express: {
      options: {
        // Override defaults here
        harmony: true,
        debug: true
      },
      dev: {
        options: {
          script: 'server.js'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('server', ['jshint', 'express:dev', 'watch' ]);

};
