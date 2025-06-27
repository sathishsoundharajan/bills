const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific resolver for better compatibility
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Ensure proper handling of react-native-web
config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config;