module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@bootstrap': './src/bootstrap',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@features': './src/features',
            '@components': './src/components',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@contexts': './src/contexts',
            '@utils': './src/utils',
            '@theme': './src/theme',
            '@types': './src/types'
          },
          extensions: ['.js', '.jsx', '.json']
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
