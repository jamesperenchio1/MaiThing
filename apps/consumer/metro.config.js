const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web-only aliases for native-only modules that cannot be bundled for web.
// These are only used when the bundler target is 'web', so they do not affect
// iOS/Android builds.
const webAliases = {
  'react-native-maps': path.resolve(__dirname, 'react-native-maps-web-stub.js'),
  '@stripe/stripe-react-native': path.resolve(__dirname, 'stripe-react-native-web-stub.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform, info) => {
  if (platform === 'web' && webAliases[moduleName]) {
    return { filePath: webAliases[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform, info);
  }
  // Fall back to the default Metro resolver.
  return context.resolveRequest(context, moduleName, platform, info);
};

module.exports = config;
