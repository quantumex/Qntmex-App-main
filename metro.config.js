const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for crypto modules
config.resolver.extraNodeModules = {
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
  events: require.resolve('events'),
  path: require.resolve('path-browserify'),
  url: require.resolve('url'),
  http: false,
  https: false,
  zlib: false,
  fs: false,
  net: false,
  tls: false,
};

module.exports = config;
