// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ignoruj folder app, który zawiera konfigurację expo-router
config.resolver.blockList = [/^(?:.*\/)?app\/.*$/];

// Zwiększ limit rozmiaru odpowiedzi i liczbę workerów
config.maxWorkers = 4;
config.transformer.maxWorkers = 4;
config.server.maxWorkers = 4;
config.watchFolders = [__dirname];
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Konfiguracja dla większych odpowiedzi
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Zwiększ limit rozmiaru odpowiedzi
config.server.maxResponseSize = 10 * 1024 * 1024; // 10MB

module.exports = config;
