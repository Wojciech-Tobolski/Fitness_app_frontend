import React from "react";
import { StatusBar, LogBox, Platform } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { useEffect } from "react";

// Ignoruj ostrzeżenia o dużych odpowiedziach
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
  'resource exceeds maximum size',
]);

// Ignoruj ostrzeżenia o debugowaniu
LogBox.ignoreLogs([
  "Remote debugger is in a background tab",
  "Debugger and device times have drifted by more than 60s",
]);

export default function App() {
  useEffect(() => {
    // Wyłącz debugowanie Chrome na iOS
    if (Platform.OS === 'ios') {
      global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
    }
  }, []);

  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppNavigator />
    </AuthProvider>
  );
}
