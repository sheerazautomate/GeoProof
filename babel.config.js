// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for react-native-quick-crypto
    'module:react-native-quick-crypto/babel',
  ],
};
