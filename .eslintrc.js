module.exports = {
    parser: 'babel-eslint',
    env: {
        browser: true,
        es6: true,
        commonjs: true,
        node: true,
        jest: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    plugins: ['react'],
    rules: {
        // JS rules
        indent: ['error', 2],
        quotes: ['error', 'single'],
        semi: [2, 'never'],
        'linebreak-style': ['error', 'unix'],
        'comma-dangle': [2, 'never'],
        'prefer-template': 'error',
        'no-useless-concat': 'error',
        'max-len': ['error', { code: 80 }],
        'prefer-const': [
            'error',
            {
                destructuring: 'any',
                ignoreReadBeforeAssign: false
            }
        ],
        // React rules
        'react/jsx-no-bind': [
            'error',
            {
                allowArrowFunctions: true,
                allowBind: false,
                ignoreRefs: true
            }
        ],
        'react/jsx-uses-vars': [1],
        'react/jsx-uses-react': 'error',
        'react/no-did-update-set-state': 'error',
        'react/no-unknown-property': 'error',
        'react/no-unused-prop-types': 'error',
        'react/prop-types': 'error',
        'react/react-in-jsx-scope': 'error',
        'jsx-quotes': ['error', 'prefer-double']
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
}