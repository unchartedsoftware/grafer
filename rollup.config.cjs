'use strict';
const path = require('path');
const typescript = require('rollup-plugin-typescript2');
const sourceMaps = require('rollup-plugin-sourcemaps');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const replace = require('@rollup/plugin-replace');
const globby = require('globby');
const server = require('live-server');

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

// Environments configuration is being generated for
const environments = {
    DEV: 'development',
    PROD: 'production',
};

// Types of configurations to generate
const types = {
    LIB: 'lib',
    DIST: 'dist',
    DEV: 'dev',
    TEST: 'test',
};

// Directories where the build files will be written
const buildDir = path.resolve(__dirname, 'build');
const outputDirs = {
    [types.LIB]: path.join(buildDir, 'lib'),
    [types.DEV]: path.join(buildDir, 'dev'),
    [types.DIST]: path.join(buildDir, 'dist'),
};

function liveServer (options = {}) {
    const defaultParams = {
        file: 'index.html',
        host: '0.0.0.0',
        logLevel: 2,
        open: false,
        port: 8080,
        root: '.',
        wait: 200,
    };

    const params = Object.assign({}, defaultParams, options);

    server.start(params);
    return {
        name: 'liveServer',
        generateBundle () {
            console.log(`live-server running on ${params.port}`);
        },
    };
}

function inputForType (type) {
    if (type === types.TEST) {
        return undefined;
    }

    const input = {};

    if (type === types.DIST) {
        input['mod'] = path.join(outputDirs[types.DEV], 'js', 'mod.js');
    } else if (type === types.LIB || type === types.DEV) {
        globby.sync([
            path.join('src/', '/**/*.{ts,js}'),
            `!${path.join('src/', '/**/*.d.ts')}`,
        ]).forEach(file => {
            const parsed = path.parse(file);
            const output = path.join(parsed.dir.substr('src/'.length), parsed.name);
            input[type === types.DEV ? path.join('js', output) : output] = file;
        });
    }

    return { input };
}

function outputForType (type) {
    if (type === types.TEST) {
        return {
            output: {
                format: 'iife',
                name: 'test_scripts',
                sourcemap: 'inline',
            },
        };
    }

    return {
        output: {
            dir: outputDirs[type],
            format: 'esm',
            sourcemap: type !== types.DIST,
            chunkFileNames: 'web_modules/[name]',
            // paths: id => console.log(id),
        },
    };
}

function pluginsForType (type) {
    const plugins = [];
    if (type === types.DEV || type === types.TEST) {
        plugins.push(
            resolve({
                extensions,
                jsnext: true,
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
        );
    }

    if (type !== types.DIST) {
        plugins.push(
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL),
            }),
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
            }),
        );
    }

    return { plugins };
}

function chunksForType (type) {
    if (type === types.DEV) {
        return {
            manualChunks: function (id) {
                if (id.includes('tslib.js')) {
                    return 'tslib';
                }

                if (id.includes('node_modules/')) {
                    const parsed = path.parse(id);
                    const folders = parsed.dir.split('/');
                    while (folders.shift() !== 'node_modules') {}
                    if (folders.length > 1 && folders[0].startsWith('@')) {
                        return path.join(folders[0], `${folders[1]}.js`);
                    }
                    return `${folders[0]}.js`;
                }

                if (!path.isAbsolute(id)) {
                    return id;
                }
            },
        };
    }

    return undefined;
}

function externalForType (type) {
    if (type === types.LIB) {
        return {
            external: function (id) {
                try {
                    const resolved = require.resolve(id);
                    if (path.isAbsolute(resolved) && resolved.includes('node_modules/')) {
                        return true;
                    }
                } catch (e) {
                    return false;
                }
            },
        }
    }

    return undefined;
}

function generateClientConfig (type, startDevServer = false) {
    const config = Object.assign(
        {
            treeshake: true,
            watch: {
                clearScreen: false,
            },
        },
        inputForType(type),
        outputForType(type),
        pluginsForType(type),
        chunksForType(type),
        externalForType(type),
    );

    if (startDevServer) {
        config.plugins.push(sourceMaps());
        config.plugins.push(liveServer({
            port: 8090,
            host: '0.0.0.0',
            root: path.resolve(__dirname, 'examples/'),
            file: 'index.html',
            open: false,
            wait: 500,
            // proxy: [['/api', 'http://127.0.0.1:8080']], // not needed for now, used to proxy to the server API
            watch: [
                path.resolve(__dirname, 'build/dev/js'),
                path.resolve(__dirname, 'examples/'),
            ],
            mount: [
                ['/js', path.resolve(__dirname, 'build/dev/js')],
                ['/web_modules', path.resolve(__dirname, 'build/dev/web_modules')],
            ],
        }));
    }

    return config;
}

module.exports = function generator (args) {
    const config = [];

    if (args['config-all']) {
        config.push(generateClientConfig(types.LIB, false));
        config.push(generateClientConfig(types.DEV, false));
        config.push(generateClientConfig(types.DIST, false));
    } else {
        let type;
        if (args['config-dist']) {
            type = types.DIST;
        } else if (args['config-test']) {
            type = types.TEST;
        } else if (args['config-dev'] || args['config-dev-server']) {
            type = types.DEV;
        } else {
            type = types.LIB;
        }

        config.push(generateClientConfig(type, args['config-dev-server']));
    }

    return config;
};
