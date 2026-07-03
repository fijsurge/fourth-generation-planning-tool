// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// android/ and wear-app/ are native project folders regenerated locally by
// `expo prebuild` and Gradle — they're huge (GB-scale build caches) and not
// part of the JS bundle. Watching them makes Metro's file watcher time out
// on Windows ("Failed to start watch mode").
config.resolver.blockList = [
  /android[\/\\].*/,
  /wear-app[\/\\].*/,
];

module.exports = config;
