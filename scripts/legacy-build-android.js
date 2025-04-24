#!/usr/bin/env node

/**
 * Android Build Script - używa starszego systemu budowania Expo
 * Ten skrypt buduje plik APK dla urządzeń z Androidem
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Rozpoczynam proces budowania dla Androida...");
console.log(
  "Używam starszego systemu budowania Expo, który działa na każdym systemie."
);

try {
  // Sprawdź, czy użytkownik jest zalogowany
  console.log("🔑 Sprawdzam logowanie do Expo...");
  try {
    execSync("npx expo whoami", { stdio: "pipe" });
  } catch (e) {
    console.log("📝 Nie jesteś zalogowany do Expo. Proszę zaloguj się:");
    execSync("npx expo login", { stdio: "inherit" });
  }

  // Uruchom budowanie Expo dla Androida
  console.log("⚙️ Uruchamiam Expo build:android...");
  console.log("Ten proces może potrwać kilkanaście minut...");

  // Budowanie APK
  execSync("npx expo build:android -t apk", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("✅ Proces budowania rozpoczęty pomyślnie!");
  console.log("Expo będzie kontynuować budowanie w chmurze.");
  console.log("\n📱 Po zakończeniu budowania:");
  console.log(
    "1. Odwiedź stronę https://expo.dev/accounts/[twój-użytkownik]/projects/fitness_app/builds"
  );
  console.log("2. Pobierz plik APK z listy zakończonych buildów");
  console.log("3. Prześlij plik APK na urządzenie z Androidem");
  console.log("4. Kliknij na plik APK, aby go zainstalować");
  console.log(
    "5. Możliwe, że będzie trzeba włączyć opcję 'Instalacja z nieznanych źródeł' w ustawieniach urządzenia"
  );
} catch (error) {
  console.error("❌ Proces nie powiódł się:", error.message);
  console.error("Sprawdź powyższy komunikat błędu i spróbuj ponownie");
  process.exit(1);
}
