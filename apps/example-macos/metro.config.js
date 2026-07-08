const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '../..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

// When bundling for macOS the CLI rewrites `react-native` imports to
// `react-native-macos`. Library sources at the monorepo root resolve their
// dependencies through `extraNodeModules` (which only covers declared peer
// deps), so the rewritten name needs an explicit mapping to this app's copy.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-macos': path.resolve(__dirname, 'node_modules/react-native-macos'),
};

module.exports = config;
