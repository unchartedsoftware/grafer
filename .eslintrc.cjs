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
                '@typescript-eslint/no-parameter-properties': 2,
                '@typescript-eslint/no-explicit-any': 0,
                '@typescript-eslint/no-var-requires': 2,
                '@typescript-eslint/no-non-null-assertion': 2,
                '@typescript-eslint/no-use-before-define': 2,
                '@typescript-eslint/camelcase': 0,
                '@typescript-eslint/no-empty-interface': 2,
                '@typescript-eslint/explicit-function-return-type': 2,
                '@typescript-eslint/ban-ts-ignore': 0,
                '@typescript-eslint/no-inferrable-types': [2, {
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
                'import/no-namespace': 0,
                'import/prefer-default-export': 0,
            },
        },
    ],

    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'err' : 'warn',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'err' : 'warn',
        // enforce comma dangle
        'comma-dangle': [2, {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'never'
        }],
        // semicolon stuff
        'no-extra-semi': 2,
        'semi-spacing': [1, { before: false, after: true }],
        semi: [1, 'always'],
    },
};
