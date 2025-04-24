module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Używamy tylko React Native Reanimated
      ["react-native-reanimated/plugin"],
    ],
  };
};
