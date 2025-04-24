import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";
import App from "./App";

// Rejestracja głównego komponentu aplikacji
AppRegistry.registerComponent("main", () => App);

// Expo również używa tej funkcji
registerRootComponent(App);
