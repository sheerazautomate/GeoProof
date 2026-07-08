// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for react-native-reanimated v4 (worklets transform moved to
    // its own package). Must stay last in this list.
    'react-native-worklets/plugin',
  ],
};
