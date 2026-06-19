module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-worklets/reanimated must be the LAST plugin.
    plugins: ["react-native-worklets/plugin"],
  };
};
