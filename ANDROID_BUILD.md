# Android Build Guide

Ten dokument zawiera instrukcje dotyczące budowania aplikacji na urządzenia z Androidem do celów testowych.

## Wymagania

- Node.js zainstalowany na komputerze
- Konto Expo (darmowe) do korzystania z Expo Build
- Zainstalowane narzędzie Expo CLI

## Instalacja narzędzi

```bash
# Instalacja Expo CLI
npm install -g expo-cli

# Zaloguj się do konta Expo (wymagane)
expo login
```

## Opcja 1: Budowanie APK dla Androida (EAS Build)

1. Uruchom skrypt budujący:

```bash
npm run build:android
```

2. Skrypt automatycznie sprawdzi, czy jesteś zalogowany do EAS i rozpocznie proces budowania w chmurze
3. Postęp budowy możesz śledzić na stronie Expo Build, do której link pojawi się w konsoli
4. Po zakończeniu, będziesz mógł pobrać plik APK ze strony Expo Build

## Opcja 2: Budowanie APK dla Androida (Classic Build)

Jeśli napotkasz problemy z EAS Build, możesz użyć starszego systemu budowania Expo:

```bash
npm run build:android:legacy
```

Ten sposób działa podobnie, ale używa starszego systemu build, który może być bardziej zgodny z niektórymi projektami.

## Dystrybucja pliku APK do testerów

1. Pobierz gotowy plik APK z panelu Expo Build
2. Prześlij plik APK do testerów przez email, komunikator lub usługę udostępniania plików
3. Testerzy powinni pobrać plik APK na swoje urządzenie z Androidem
4. Aby zainstalować APK, należy kliknąć na pobrany plik
5. Może być wymagane włączenie opcji "Instalacja z nieznanych źródeł" w ustawieniach urządzenia

## Rozwiązywanie problemów

Jeśli proces budowania nie powiedzie się:

1. Sprawdź błędy w konsoli
2. Upewnij się, że masz aktywne konto Expo i jesteś zalogowany
3. Sprawdź, czy Twój projekt jest poprawnie skonfigurowany
4. Jeśli EAS Build nie działa, spróbuj alternatywnej metody Classic Build
5. Sprawdź status swoich buildów na stronie: https://expo.dev/accounts/[twoja-nazwa-użytkownika]/projects/[nazwa-projektu]/builds

## Dodatkowe informacje

- Skrypt buduje wersję `preview` aplikacji zgodnie z konfiguracją w pliku `eas.json`
- Proces budowania odbywa się w chmurze Expo, więc działa na każdym systemie operacyjnym
- Aby dowiedzieć się więcej, odwiedź dokumentację:
  - EAS Build: https://docs.expo.dev/build/introduction/
  - Classic Build: https://docs.expo.dev/classic/building-standalone-apps/
