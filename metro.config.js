const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    // react-native-quick-crypto needs this
    extraNodeModules: {
      crypto: require.resolve('react-native-quick-crypto'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
