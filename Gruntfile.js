module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {separator: '\n'},
      dist: {
        src: ['public/client/*.js'],
        dest: 'public/dist/<%= pkg.name %>.js'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/*.js']
      }
    },

    nodemon: {
      dev: {
        script: 'server.js'
      }
    },

    uglify: {
      target: {
        files: {
          'public/dist/<%= pkg.name %>.min.js': ['public/client/*.js']
        }
      }
    },

    eslint: {
      target: [
        'app/**/*.js',
        'lib/*.js',
        'public/client/*.js',
        'test/*.js',
        '*.js'
      ]
    },

    cssmin: {
        // Add list of files to lint here

    },

    watch: {
      scripts: {
        files: [
          'public/client/**/*.js',
          'public/lib/**/*.js',
        ],
        tasks: [
          'concat',
          'uglify'
        ]
      },
      css: {
        files: 'public/*.css',
        tasks: ['cssmin']
      }
    },

    shell: {
      prodServer: {
      }
    },

    gitpush: {
      task: {
        options: {
          remote: 'live',
          branch: 'master',
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-git');

  /****************************************************
    Main grunt tasks
  ****************************************************/

  grunt.registerTask('default', ['deploy']);

  // Production server tasks
  grunt.registerTask('deploy', [
    'eslint', // Checks for style guide errors
    'build', // Builds uglified view files
    'test', // Runs Mocha tests
    'upload' // 
  ]);

  // Runs concat and uglify (minify) on view scripts
  grunt.registerTask('build', ['concat', 'uglify']);
  
  // Starts server (via nodemon) and runs watch
  grunt.registerTask('server-dev', function(target) {
    grunt.task.run([ 'nodemon', 'watch' ]);
  });

  // Runs Mocha tests
  grunt.registerTask('test', ['mochaTest']);

  // Pushes code to live server if 'grunt deploy --prod' is called
  // Otherwise, if 'grunt' is called, starts server and runs watch
  grunt.registerTask('upload', function(n) {
    if (grunt.option('prod')) {
      grunt.task.run(['gitpush']);
    } else {
      grunt.task.run([ 'server-dev' ]);
    }
  });
};
