module.exports = {
    root: true,

    env: {
        browser: true,
        es2020: true,
        mocha: true,
        worker: true,
    },

    parserOptions: {
        ecmaVersion: 2020,
    },

    overrides: [
        {
            files: ['*.ts', '*.tsx'],

            parserOptions: {
                parser: '@typescript-eslint/parser',
            },

            plugins: [
                '@typescript-eslint',
            ],

            extends: [
                'plugin:@typescript-eslint/recommended',
            ],

            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-var-requires': 'error',
                '@typescript-eslint/no-non-null-assertion': 'error',
                '@typescript-eslint/no-use-before-define': 'error',
                '@typescript-eslint/camelcase': 'off',
                '@typescript-eslint/no-empty-interface': 'error',
                '@typescript-eslint/explicit-function-return-type': 'error',
                '@typescript-eslint/ban-ts-ignore': 'off',
                '@typescript-eslint/no-inferrable-types': ['error', {
                    ignoreParameters: true,
                    ignoreProperties: true,
                }],
            },
        },

        {
            files: ['*.js', '*.jsx'],

            extends: [
                'esnext',
            ],

            rules: {
                'import/no-namespace': 'off',
                'import/prefer-default-export': 'off',
            },
        },
    ],

    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'err' : 'warn',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'err' : 'warn',
        // enforce comma dangle
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'never'
        }],
        // semicolon stuff
        'no-extra-semi': 'error',
        'semi-spacing': ['warn', { before: false, after: true }],
        semi: ['warn', 'always'],
    },
};
