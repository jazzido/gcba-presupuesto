module.exports = function(grunt) {
    // load grunt tasks based on dependencies in package.json
    require('load-grunt-tasks')(grunt);

    grunt.config.init({
        useminPrepare: {
            html: 'index.html',
            options: {
                dest: 'dist'
            }
        },
        usemin:{
            html:['dist/index.html']
        },
        copy:{
            html: {
                src: './index.html',
                dest: 'dist/index.html'
            },
            data: {
                expand: true,
                src: ['Data/*'],
                dest: 'dist/'
            },
            icons: {
                expand: true,
                src: ['icons/**'],
                dest: 'dist/'
            },
            bastrap: {
                files: [
                    {
                        expand: true,
                        src: [ 'bastrap3/*.{png,svg}' ],
                        dest: 'dist/'
                    },
                    {expand: true, cwd: 'bastrap3/fonts/', src: ['**'], dest: 'dist/fonts/'},

                ]}
        }
    });

    grunt.registerTask('default',[
        'copy:html',
        'copy:data',
        'copy:icons',
        'copy:bastrap',
        'useminPrepare',
        'concat',
        'uglify',
        'cssmin',
        'usemin'
    ]);
}
