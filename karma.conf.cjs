const rollupConf = require('./rollup.config.cjs');

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        basePath: '.',
        files: [
            {
                pattern: 'tests/**/*.spec.ts',
                watched: false,
            },
        ],
        preprocessors: {
            'tests/**/*.spec.ts': ['rollup'],
        },
        rollupPreprocessor: rollupConf({ 'config-test': true })[0],
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
