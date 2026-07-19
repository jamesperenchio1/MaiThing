const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web-only aliases: map native-only modules to their web equivalents or stubs.
// `unstable_enableSymlinks` lets Metro follow pnpm symlinks so that
// `react-native-web` resolves `react` from the consumer's node_modules tree,
// avoiding duplicate React copies in the web bundle.
const webAliases = {
  'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
  'react-native-maps': path.resolve(__dirname, 'react-native-maps-web-stub.js'),
  '@stripe/stripe-react-native': path.resolve(__dirname, 'stripe-react-native-web-stub.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform, info) => {
  if (platform === 'web') {
    // Handle subpath imports like react-native/Libraries/... by matching the package name prefix.
    const aliasKey = Object.keys(webAliases).find(
      (key) => moduleName === key || moduleName.startsWith(`${key}/`),
    );
    if (aliasKey) {
      const basePath = webAliases[aliasKey];
      const subpath = moduleName.slice(aliasKey.length + 1);
      const filePath = subpath ? path.resolve(basePath, subpath) : basePath;
      return { filePath, type: 'sourceFile' };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform, info);
  }
  // Fall back to the default Metro resolver.
  return context.resolveRequest(context, moduleName, platform, info);
};

config.resolver.unstable_enableSymlinks = true;
config.resolver.useWatchman = false;

module.exports = config;
