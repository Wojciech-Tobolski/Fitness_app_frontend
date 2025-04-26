// Centralna konfiguracja aplikacji
import { Platform } from "react-native";

// ==========================================
// Configuration for official backend
// ==========================================
export const BACKEND_IP = "app.trenerwitek.pl"; // Tylko domena, bez "/api"

// Use production mode to connect to official backend
export const DEV_MODE = false;
export const BACKEND_PORT = "80"; // Port HTTP

// Pełne adresy dla backendowych endpointów
export const getApiUrl = () => {
  if (DEV_MODE) {
    return 'http://localhost:8081/api'; // Use proxy during development
  }
  return 'https://app.trenerwitek.pl/api';
};

// Bazowy URL serwera (bez /api)
export const getBaseUrl = () => {
  if (DEV_MODE) {
    return 'http://localhost:8081';
  }
  return 'https://app.trenerwitek.pl';
};

/**
 * Get the full URL for media files
 * @param {string} path - The relative path to the media file
 * @returns {string} The full URL to the media file
 */
export const getFullMediaUrl = (path) => {
  // If the path already includes http, it's already a full URL
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }

  // Otherwise, prepend the base URL
  return `${getBaseUrl()}${path}`;
};

// Token storage keys
export const TOKEN_KEY = "userToken";
export const TOKEN_EXPIRY_KEY = "tokenExpiry";
export const REFRESH_TOKEN_KEY = "refreshToken";

export default {
  DEV_MODE,
  BACKEND_IP,
  BACKEND_PORT,
  getApiUrl,
  getBaseUrl,
  getFullMediaUrl,
  TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  REFRESH_TOKEN_KEY,
};
