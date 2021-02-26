module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        basePath: '.',
        files: [
            {
                pattern: 'tests/**/*.spec.ts',
                watched: false,
                type: 'js',
            },
        ],
        preprocessors: {
            'tests/**/*.spec.ts': ['esbuild', 'sourcemap'],
        },
        esbuild: {
            globalName: 'test_scripts',
            plugins: [
                {
                    name: 'kill-glsl',
                    setup(build) {
                        build.onLoad({ filter: /\.(?:glsl)$/ }, () => {
                            return {
                                contents: '',
                                loader: 'text',
                            }
                        });
                    },
                },
            ],
        },
        reporters: ['mocha'],
        port: 9876, // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity,
    });
};
