const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support additional file extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// Allow require.context (needed for some Expo modules)
config.transformer.unstable_allowRequireContext = true;

module.exports = config;