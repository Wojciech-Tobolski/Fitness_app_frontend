import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  getApiUrl,
  getBaseUrl,
  TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  REFRESH_TOKEN_KEY,
  DEV_MODE,
} from "../config/config";

// Constants
const TIMEOUT_MS = 30000;

// Storage helper functions
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

/**
 * Class managing API communication
 */
class ApiService {
  constructor() {
    this.baseUrl = getApiUrl();
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // Initialize token when instance is created
    this._initializeToken();
  }

  async _initializeToken() {
    try {
      this.token = await storage.getItem(TOKEN_KEY);
      this.refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
      const expiryStr = await storage.getItem(TOKEN_EXPIRY_KEY);
      this.tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : null;

      console.log(`[ApiService] Token initialized: ${this.token ? "Yes" : "No"}`);
    } catch (error) {
      console.error("[ApiService] Failed to initialize token:", error);
    }
  }

  async _getHeaders() {
    const token = await this.getToken();
    if (!token) {
      console.error("[ApiService] No token available for request");
      throw new Error("No authentication token available");
    }
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    };
  }

  async request(method, endpoint, data = null, options = {}) {
    try {
      console.log(`[ApiService] Making ${method} request to ${endpoint}`);
      console.log(`[ApiUrl] Base URL: ${this.baseUrl}`);
      console.log(`[ApiUrl] Full URL: ${this.baseUrl}${endpoint}`);
      console.log(`[ApiService] Request data:`, data);

      const token = await this.getToken();
      if (!token) {
        console.error("[ApiService] No token available for request");
        throw new Error("No authentication token available");
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        ...(options.headers || {})
      };

      console.log("[ApiService] Request headers:", headers);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        ...(data ? { body: JSON.stringify(data) } : {}),
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[ApiService] Response from ${endpoint}:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[ApiService] Error during ${method} request to ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint, params = null, options = {}) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request('GET', `${endpoint}${queryString}`, null, options);
  }

  async post(endpoint, data = null, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  async put(endpoint, data = null, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  async delete(endpoint, data = null, options = {}) {
    return this.request('DELETE', endpoint, data, options);
  }

  async getToken() {
    try {
      if (this.token) {
        console.log("[ApiService] Using cached token");
        return this.token;
      }
      console.log("[ApiService] Getting token from storage");
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) {
        console.error("[ApiService] No token found in storage");
        return null;
      }
      this.token = token;
      console.log("[ApiService] Token retrieved from storage");
      return token;
    } catch (error) {
      console.error("[ApiService] Error getting token:", error);
      return null;
    }
  }

  async setToken(accessToken, refreshToken = null) {
    try {
      if (!accessToken) {
        console.error("[ApiService] Cannot set empty token");
        return;
      }
      console.log("[ApiService] Setting token:", accessToken);
      this.token = accessToken;
      this.refreshToken = refreshToken;

      await storage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      console.log("[ApiService] Tokens set successfully");
    } catch (error) {
      console.error("[ApiService] Error setting tokens:", error);
      throw error;
    }
  }

  async clearToken() {
    try {
      this.token = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.isRefreshing = false;
      this.refreshSubscribers = [];

      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
      await storage.removeItem(TOKEN_EXPIRY_KEY);

      console.log("[ApiService] Tokens cleared successfully");
    } catch (error) {
      console.error("[ApiService] Error clearing tokens:", error);
      throw error;
    }
  }

  getFullMediaUrl(relativePath) {
    if (!relativePath) return null;

    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return relativePath;
    }

    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

    const baseUrl = getBaseUrl();
    const fullUrl = `${baseUrl}/${cleanPath}`;
    console.log(`[ApiService] Media URL: ${fullUrl}`);

    return fullUrl;
  }

  async setAuthTokens(token, refreshToken = null, expiresIn = null) {
    try {
      this.token = token;

      // Store token
      await storage.setItem(TOKEN_KEY, token);

      // Handle refresh token if provided
      if (refreshToken) {
        this.refreshToken = refreshToken;
        await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      // Handle expiry if provided
      if (expiresIn) {
        const expiryTime = Date.now() + expiresIn * 1000;
        this.tokenExpiry = expiryTime;
        await storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }

      console.log("[ApiService] Auth tokens saved successfully");
    } catch (error) {
      console.error("[ApiService] Failed to save auth tokens:", error);
      throw error;
    }
  }

  async getRefreshToken() {
    try {
      if (this.refreshToken) return this.refreshToken;
      return await storage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("[ApiService] Error getting refresh token:", error);
      return null;
    }
  }

  async _refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn("[ApiService] No refresh token available");
      return null;
    }

    try {
      console.log("[ApiService] Starting token refresh");
      this.isRefreshing = true;

      const refreshUrl = "/auth/refresh/";
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh: this.refreshToken })
      });

      if (response.ok) {
        console.log("[ApiService] Token refresh successful");
        const newToken = await response.json().then(data => data.access);

        // Update token in memory and storage
        await this.setToken(newToken, this.refreshToken);

        // Notify all the requests waiting for the token
        this.refreshSubscribers.forEach((callback) => callback(newToken));

        return newToken;
      } else {
        console.error(
          "[ApiService] Token refresh response invalid:",
          await response.text()
        );
        this.refreshSubscribers.forEach((callback) => callback(null));
        return null;
      }
    } catch (error) {
      console.error("[ApiService] Token refresh error:", error);
      this.refreshSubscribers.forEach((callback) => callback(null));
      return null;
    } finally {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
    }
  }

  async _handleApiError(error, operation) {
    console.error(`[ApiService] Error during ${operation}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    }
  }

  async _isTokenValid() {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log("[ApiService] No token available");
        return false;
      }

      // If there's no expiry or it's in the future, token is valid
      if (!this.tokenExpiry || this.tokenExpiry > Date.now()) {
        return true;
      }

      console.log("[ApiService] Token expired, clearing");
      await this.clearToken();
      return false;
    } catch (error) {
      console.error("[ApiService] Error checking token validity:", error);
      return false;
    }
  }

  async setAuth(tokens, user = null) {
    if (tokens?.accessToken) {
      await storage.setItem(TOKEN_KEY, tokens.accessToken);
    }

    if (tokens?.refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    if (user) {
      await storage.setItem("user", JSON.stringify(user));
    }
  }

  async getAccessToken() {
    return await storage.getItem(TOKEN_KEY);
  }

  async getUser() {
    const userData = await storage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }

  async isAuthenticated() {
    return !!(await this.getAccessToken());
  }

  async clearAuth() {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(REFRESH_TOKEN_KEY);
    await storage.removeItem("user");
  }

  async _refreshToken() {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        await this.setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      await this.clearAuth();
      return false;
    }
  }
}

// Export a single ApiService instance as Singleton
const apiService = new ApiService();

export default apiService;