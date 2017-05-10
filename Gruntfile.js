module.exports = (grunt) => {

    const fs = require('fs-extra');
    const builder = require(`corifeus-builder`);

    const requiredFile = 'corifeus-boot.json';
    if (!fs.existsSync(`./${requiredFile}`)) {
        fs.copySync(`./artifacts/skeleton/${requiredFile}`, `./${requiredFile}`);
    }

    const loader = new builder.loader(grunt);
    loader.js({
        replacer: {
            npmio: true
        },
        jit: {
            express: 'grunt-express-server',
        },
        config: {
            'mocha_istanbul': {
                options: {
                    excludes: [
                        './src/lib/settings/index.js'
                    ]
                }
            },

            express: {
                options: {
                    delay: 1000,
                },
                src: {
                    options: {
                        script: './boot',
                        debug: false
                    }
                },
            },
            watch: {
                express: {
                    files: ["src/**/*.*", 'boot', 'Gruntfile.js', 'boot.json'],
                    tasks: ['express:src'],
                    options: {
                        // for grunt-contrib-watch v0.5.0+, "nospawn: true" for lower versions. Without this option specified express won't be reloaded
                        spawn: false
                    }
                }
            }
        }
    });


    grunt.registerTask('default', builder.config.task.build.js);
    grunt.registerTask('run', ['clean', 'express:src', 'watch:express']);

};