import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl, getBaseUrl, DEV_MODE } from "../config/config";

// Use development server during testing
const API_URL = getApiUrl();
console.log(`Using API URL: ${API_URL}`);

// Storage helper
const isWeb = Platform.OS === 'web';
const storage = {
  async getItem(key) {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key) {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Funkcja do konwersji względnych ścieżek mediów na pełne adresy URL
export const getFullMediaUrl = (relativePath) => {
  if (!relativePath) return null;

  // Jeśli ścieżka już zawiera http lub https, zwróć ją bez zmian
  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://")
  ) {
    return relativePath;
  }

  // Usuń początkowy ukośnik, jeśli istnieje
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.substring(1)
    : relativePath;

  // Połącz bazowy URL z względną ścieżką
  const baseUrl = getBaseUrl();
  console.log(`[Media URL] Base: ${baseUrl}, Path: ${cleanPath}`);
  return `${baseUrl}/${cleanPath}`;
};

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log("[Token added to request]:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("[API Response]:", response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (username, password) => {
  try {
    console.log(`Attempting to login with username: ${username}`);

    // Próba logowania z pełną ścieżką
    try {
      console.log("Trying auth endpoint");
      const response = await api.post("/auth", { username, password });
      console.log("Login successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("Login error:", error.message);
    console.error("Full error details:", JSON.stringify(error, null, 2));

    // Pokaż dokładne informacje o błędzie z API
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data from server:`, error.response.data);

      // Zwracamy błąd z API, jeśli istnieje
      throw {
        success: false,
        error:
          error.response.data.detail ||
          error.response.data.non_field_errors ||
          "Nieprawidłowe dane logowania",
        originalError: error,
      };
    }

    throw {
      success: false,
      error: "Problem z połączeniem do serwera",
      originalError: error,
    };
  }
};

// User endpoints
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/user/current/");
    return response.data;
  } catch (error) {
    console.error("Get current user error:", error.message);
    throw error;
  }
};

export const getUserImage = async () => {
  try {
    const response = await api.get("/user/current/image");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Workouts endpoints
export const getGeneralWorkouts = async () => {
  try {
    const response = await api.get("/workouts/general/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPersonalWorkouts = async () => {
  try {
    const response = await api.get("/workouts/personal/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTodayWorkouts = async () => {
  try {
    const response = await api.get("/workouts/personal/today/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Tag categories endpoints
export const getTagCategories = async () => {
  try {
    // Sprawdź token przed wysłaniem żądania
    const token = await storage.getItem("userToken");
    console.log(
      "Token przy pobieraniu kategorii:",
      token ? "Token dostępny" : "Brak tokena"
    );

    // Jawnie dodajemy nagłówek Authorization dla pewności
    const headers = token ? { Authorization: `Token ${token}` } : {};
    const response = await api.get("/tagcategory", { headers });

    return response.data;
  } catch (error) {
    console.error("Get tag categories error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

// Exercises endpoints
export const getExercises = async (tagId = null) => {
  try {
    // Sprawdź token przed wysłaniem żądania
    const token = await storage.getItem("userToken");
    console.log(
      "Token przy pobieraniu ćwiczeń:",
      token ? "Token dostępny" : "Brak tokena"
    );

    // Buduj URL z filtrem tag_id jeśli jest podany
    let url = "/exercises/";
    if (tagId) {
      url += `?tag_id=${tagId}`;
    }
    console.log(`Sending request to: ${API_URL}${url}`);

    // Jawnie dodajemy nagłówek Authorization dla pewności
    const headers = token ? { Authorization: `Token ${token}` } : {};
    const response = await api.get(url, { headers });

    return response.data;
  } catch (error) {
    console.error("Get exercises error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

export const getExerciseDetails = async (exerciseId) => {
  try {
    // Sprawdź token przed wysłaniem żądania
    const token = await storage.getItem("userToken");
    console.log(
      "Token przy pobieraniu szczegółów ćwiczenia:",
      token ? "Token dostępny" : "Brak tokena"
    );

    // Jawnie dodajemy nagłówek Authorization dla pewności
    const headers = token ? { Authorization: `Token ${token}` } : {};
    const response = await api.get(`/exercises/${exerciseId}/`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      `Get exercise details error for ID ${exerciseId}:`,
      error.message
    );
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

export default api;
