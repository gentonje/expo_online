const expo = require('eslint-config-expo/flat');

module.exports = [
    {
        ignores: ['dist/*', '.expo/*', 'web-build/*', 'android/*', 'ios/*', 'node_modules/*'],
    },
    ...expo,
    {
        files: ['**/*.js', 'scripts/**/*.js'],
        languageOptions: {
            globals: {
                ...require('globals').node,
            },
        },
    },
];
