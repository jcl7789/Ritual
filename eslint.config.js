// eslint.config.js for Ritual project (ESLint v9+)
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: 'readonly',
                btoa: 'readonly',
                atob: 'readonly',
                __DEV__: 'readonly',
                React: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            'no-unused-vars': 'off', // Disable base rule
            '@typescript-eslint/no-unused-vars': 'warn', // Only warn for TS
            '@typescript-eslint/no-explicit-any': 'off',
            'no-undef': 'off',
        },
    },
    prettier,
];
