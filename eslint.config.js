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

        files: [
            'src/**/*.vue', 
            'src/**/*.[tj]{s,sx}',
            'src/**/*.[mc][tj]s'
        ],

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
            "vue/require-v-for-key": "warn",
        },
    },
    eslintConfigPrettier
);