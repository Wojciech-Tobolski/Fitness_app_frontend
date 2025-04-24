#!/usr/bin/env node

/**
 * Android Build Script
 * This script builds an Android APK for testing on other devices using EAS Build
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const BUILD_PROFILE = "simulator"; // Using the simulator profile from eas.json

console.log("🚀 Starting Android build process...");
console.log(
  "Używam EAS Build w chmurze z trybem simulator, co powinno działać na każdym systemie."
);

try {
  // Ensure user is logged in
  console.log("🔑 Sprawdzam logowanie do EAS...");
  try {
    execSync("npx eas-cli whoami", { stdio: "pipe" });
  } catch (e) {
    console.log("📝 Nie jesteś zalogowany do EAS. Proszę zaloguj się:");
    execSync("npx eas-cli login", { stdio: "inherit" });
  }

  // Run EAS build for Android in the cloud
  console.log("⚙️ Uruchamiam EAS build z profilem:", BUILD_PROFILE);
  console.log("Ten proces może potrwać kilka minut...");

  execSync(
    `npx eas-cli build --platform android --profile ${BUILD_PROFILE} --non-interactive`,
    {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    }
  );

  console.log("✅ Proces budowania rozpoczęty pomyślnie!");
  console.log("EAS Build będzie kontynuować budowanie w chmurze.");
  console.log(
    "Po zakończeniu będziesz mógł pobrać plik APK z panelu EAS Build."
  );
  console.log("\n📱 Po pobraniu pliku APK, instrukcje dla testerów:");
  console.log("1. Prześlij plik APK na urządzenie z Androidem");
  console.log("2. Kliknij na plik APK, aby go zainstalować");
  console.log(
    "3. Możliwe, że będzie trzeba włączyć opcję 'Instalacja z nieznanych źródeł' w ustawieniach urządzenia"
  );
} catch (error) {
  console.error("❌ Proces nie powiódł się:", error.message);
  console.error("Sprawdź powyższy komunikat błędu i spróbuj ponownie");
  process.exit(1);
}
