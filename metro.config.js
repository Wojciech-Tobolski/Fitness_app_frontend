// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ignoruj folder app, który zawiera konfigurację expo-router
config.resolver.blockList = [/^(?:.*\/)?app\/.*$/];

module.exports = config;
