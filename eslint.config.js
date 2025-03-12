import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(

    {
        extends: [
            eslint.configs.recommended,
            ...typescriptEslint.configs.recommended,
            ...eslintPluginVue.configs['flat/recommended'],
        ],

        files: ['src/**/*.{ts,vue}'],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                parser: typescriptEslint.parser,
            },
        },

        rules: {
            "no-fallthrough": "warn",
            "no-inner-declarations": "warn",
        },
    },
    eslintConfigPrettier
);