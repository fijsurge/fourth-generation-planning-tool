module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
    },
  ],
};