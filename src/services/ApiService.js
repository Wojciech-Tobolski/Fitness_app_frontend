import axios from "axios";
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

/**
 * Class managing API communication
 */
class ApiService {
  constructor() {
    this.baseUrl = getApiUrl();
    this.apiClient = this._createApiClient();
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // Initialize token when instance is created
    this._initializeToken();

    // Setup request and response interceptors
    this._setupInterceptors();
  }

  /**
   * Gets the base API URL depending on platform
   * @returns {string} Base API URL
   * @private
   */
  _getBaseUrl() {
    return getApiUrl();
  }

  /**
   * Creates an Axios client instance
   * @returns {AxiosInstance} Axios client instance
   * @private
   */
  _createApiClient() {
    const client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: TIMEOUT_MS,
    });

    // Add request interceptor
    client.interceptors.request.use(
      this._requestInterceptor.bind(this),
      this._requestErrorHandler.bind(this)
    );

    // Add response interceptor
    client.interceptors.response.use(
      this._responseInterceptor.bind(this),
      this._responseErrorHandler.bind(this)
    );

    return client;
  }

  /**
   * Initializes token from SecureStore
   * @private
   */
  async _initializeToken() {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      this.tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : null;

      console.log(
        `[ApiService] Token initialized: ${this.token ? "Yes" : "No"}`
      );

      // Set token in axios default headers if available
      if (this.token) {
        this.apiClient.defaults.headers.common[
          "Authorization"
        ] = `Token ${this.token}`;
        console.log(
          `[ApiService] Authorization header set in defaults: Token ${this.token.substring(
            0,
            10
          )}...`
        );
      }
    } catch (error) {
      console.error("[ApiService] Failed to initialize token:", error);
    }
  }

  /**
   * Saves authentication tokens in SecureStore and class instance
   * @param {string} token Authentication token
   * @param {string} refreshToken Refresh token (optional)
   * @param {number} expiresIn Expiration time in seconds (optional)
   * @returns {Promise<void>}
   */
  async setAuthTokens(token, refreshToken = null, expiresIn = null) {
    try {
      this.token = token;

      // Store token
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      // Handle refresh token if provided
      if (refreshToken) {
        this.refreshToken = refreshToken;
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }

      // Handle expiry if provided
      if (expiresIn) {
        const expiryTime = Date.now() + expiresIn * 1000;
        this.tokenExpiry = expiryTime;
        await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }

      console.log("[ApiService] Auth tokens saved successfully");
    } catch (error) {
      console.error("[ApiService] Failed to save auth tokens:", error);
      throw error;
    }
  }

  /**
   * Set authentication tokens and store them
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<void>}
   * @public
   */
  async setToken(accessToken, refreshToken) {
    try {
      this.token = accessToken;
      this.refreshToken = refreshToken;

      // Store tokens in SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }

      console.log("[ApiService] Tokens set successfully");
    } catch (error) {
      console.error("[ApiService] Error setting tokens:", error);
      throw error;
    }
  }

  /**
   * Clear authentication tokens from memory and storage
   * @returns {Promise<void>}
   * @public
   */
  async clearToken() {
    try {
      // Reset all auth-related properties
      this.token = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.isRefreshing = false;
      this.refreshSubscribers = [];

      // Reset authorization header in axios defaults
      if (this.apiClient && this.apiClient.defaults) {
        if (this.apiClient.defaults.headers) {
          delete this.apiClient.defaults.headers.Authorization;
        }
      }

      // Remove tokens from SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);

      console.log("[ApiService] Tokens cleared successfully");
    } catch (error) {
      console.error("[ApiService] Error clearing tokens:", error);
      throw error;
    }
  }

  /**
   * Get the current access token
   * @returns {string|null} Current access token or null if not available
   * @public
   */
  async getToken() {
    try {
      if (this.token) return this.token;
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("[ApiService] Error getting token:", error);
      return null;
    }
  }

  /**
   * Get the current refresh token
   * @returns {string|null} Current refresh token or null if not available
   * @public
   */
  async getRefreshToken() {
    try {
      if (this.refreshToken) return this.refreshToken;
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("[ApiService] Error getting refresh token:", error);
      return null;
    }
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns {Promise<string|null>} New access token or null if refresh failed
   * @private
   */
  async _refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn("[ApiService] No refresh token available");
      return null;
    }

    try {
      console.log("[ApiService] Starting token refresh");
      this.isRefreshing = true;

      const refreshUrl = "/auth/refresh/";
      const response = await this.apiClient.post(
        refreshUrl,
        { refresh: this.refreshToken },
        {
          skipAuthInterceptor: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200 && response.data.access) {
        console.log("[ApiService] Token refresh successful");
        const newToken = response.data.access;

        // Update token in memory and storage
        await this.setToken(newToken, this.refreshToken);

        // Notify all the requests waiting for the token
        this.refreshSubscribers.forEach((callback) => callback(newToken));

        return newToken;
      } else {
        console.error(
          "[ApiService] Token refresh response invalid:",
          response.data
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

  /**
   * Request interceptor - adds authentication token
   * @param {Object} config Request configuration
   * @returns {Promise<Object>} Modified request configuration
   * @private
   */
  async _requestInterceptor(config) {
    try {
      // Skip adding auth header for token refresh requests
      if (config.skipAuthInterceptor) {
        return config;
      }

      // Get token (using cached value if available)
      const token = await this.getToken();

      if (token) {
        // Make sure headers are initialized
        config.headers = config.headers || {};
        config.headers.Authorization = `Token ${token}`;
        console.log(
          `[ApiService] Request with token: ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      } else {
        console.log(
          `[ApiService] Request without token: ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      }

      return config;
    } catch (error) {
      console.error("[ApiService] Request interceptor error:", error);
      return config;
    }
  }

  /**
   * Request error handler
   * @param {Error} error Request error
   * @returns {Promise<never>} Rejected promise with error
   * @private
   */
  _requestErrorHandler(error) {
    console.error("[ApiService] Request error:", error);
    return Promise.reject(error);
  }

  /**
   * Response interceptor
   * @param {Object} response API response
   * @returns {Object} API response
   * @private
   */
  _responseInterceptor(response) {
    console.log(
      `[ApiService] Response: ${response.status} from ${response.config.url}`
    );
    return response;
  }

  /**
   * Response error handler with token refresh logic
   * @param {Error} error Response error
   * @returns {Promise<never>} Rejected promise with error
   * @private
   */
  async _responseErrorHandler(error) {
    if (error.response) {
      const { status, config } = error.response;

      // Handle 401 Unauthorized error and attempt to refresh token
      if (status === 401 && this.refreshToken && !config.skipAuthInterceptor) {
        console.log(
          "[ApiService] 401 Unauthorized error detected. Trying to refresh token."
        );

        try {
          // If token is being refreshed by another request, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              console.log(
                "[ApiService] Token refresh already in progress. Queuing request."
              );
              this.refreshSubscribers.push((token) => {
                if (token) {
                  console.log("[ApiService] Retrying request with new token.");
                  // Retry original request with new token
                  config.headers.Authorization = `Token ${token}`;
                  resolve(this.apiClient(config));
                } else {
                  console.log(
                    "[ApiService] Token refresh failed. Rejecting request."
                  );
                  reject(error);
                }
              });
            });
          }

          // Refresh token and retry request
          console.log("[ApiService] Refreshing token and retrying request.");
          await this._refreshAccessToken();

          if (!this.token) {
            throw new Error("Token refresh failed");
          }

          config.headers.Authorization = `Token ${this.token}`;
          return this.apiClient(config);
        } catch (refreshError) {
          console.error("[ApiService] Failed to refresh token:", refreshError);

          // If refresh fails, clear tokens and navigate to login
          console.log("[ApiService] Clearing tokens after failed refresh.");
          await this.clearToken();

          // Create a custom error with a specific code for session expiration
          const sessionError = new Error(
            "Session expired. Please log in again."
          );
          sessionError.code = "SESSION_EXPIRED";
          return Promise.reject(sessionError);
        }
      }

      console.error(
        `[ApiService] Error ${status} from ${config?.url || "unknown URL"}`
      );
      console.error("[ApiService] Error data:", error.response.data);
    } else if (error.request) {
      console.error("[ApiService] No response received:", error.request);
    } else {
      console.error("[ApiService] Error:", error.message);
    }

    return Promise.reject(error);
  }

  /**
   * Performs a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional axios options
   * @returns {Promise<Object>} Response data
   * @public
   */
  async get(endpoint, params = null, options = {}) {
    return this.request("GET", endpoint, params, options);
  }

  /**
   * Performs a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise<Object>} Response data
   * @public
   */
  async post(endpoint, data = null, options = {}) {
    return this.request("POST", endpoint, data, options);
  }

  /**
   * Performs a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise<Object>} Response data
   * @public
   */
  async put(endpoint, data = null, options = {}) {
    return this.request("PUT", endpoint, data, options);
  }

  /**
   * Performs a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise<Object>} Response data
   * @public
   */
  async delete(endpoint, data = null, options = {}) {
    return this.request("DELETE", endpoint, data, options);
  }

  /**
   * Handles API errors in a standard way
   * @param {Error} error API error
   * @param {string} operation Operation type
   * @private
   */
  _handleApiError(error, operation) {
    console.error(`[ApiService] Error during ${operation}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    }
  }

  /**
   * Converts relative media paths to full URLs
   * @param {string} relativePath Relative path to resource
   * @returns {string|null} Full resource URL or null
   */
  getFullMediaUrl(relativePath) {
    if (!relativePath) return null;

    // If path already contains http or https, return it unchanged
    if (
      relativePath.startsWith("http://") ||
      relativePath.startsWith("https://")
    ) {
      return relativePath;
    }

    // Remove leading slash if exists
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

    // Get base URL from config
    const baseUrl = getBaseUrl();

    // Log the full URL for debugging
    const fullUrl = `${baseUrl}/${cleanPath}`;
    console.log(`[ApiService] Media URL: ${fullUrl}`);

    // Combine base URL with relative path
    return fullUrl;
  }

  /**
   * Check if the current token is valid and not expired
   * @returns {Promise<boolean>} True if token is valid and not expired
   * @private
   */
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

  /**
   * Makes an authenticated API request
   * @param {string} method - HTTP method (GET, POST, etc)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise<Object>} Response data
   * @public
   */
  async request(method, endpoint, data = null, options = {}) {
    try {
      // Check token validity before request
      const isValidToken = await this._isTokenValid();
      console.log(`[ApiService] Using token for request: ${isValidToken}`);

      // Get the current access token
      const token = isValidToken ? await this.getToken() : null;

      // Use the exact endpoint as provided
      const normalizedEndpoint = endpoint;

      // Set up request configuration
      const config = {
        method,
        url: normalizedEndpoint.startsWith("/")
          ? `${this.baseUrl}${normalizedEndpoint}`
          : `${this.baseUrl}/${normalizedEndpoint}`,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        // Disable redirect following so we don't lose headers
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept non-2xx status codes but reject server errors
        },
        ...options,
      };

      // Add authentication header if token exists
      if (token) {
        config.headers.Authorization = `Token ${token}`;
        console.log(
          `[ApiService] Adding token to ${method} ${normalizedEndpoint}: ${token.substring(
            0,
            10
          )}...`
        );
      } else {
        console.log(
          `[ApiService] No token available for ${method} ${normalizedEndpoint}`
        );
      }

      // Add data for non-GET requests
      if (method.toUpperCase() !== "GET" && data) {
        config.data = data;
      }

      // Add query parameters for GET requests
      if (method.toUpperCase() === "GET" && data) {
        config.params = data;
      }

      // Make the request
      console.log(`[ApiService] Making ${method} request to ${config.url}`);

      // Log headers for debugging
      console.log(
        `[ApiService] Request headers:`,
        JSON.stringify(config.headers)
      );

      const response = await this.apiClient(config);

      console.log(`[ApiService] Response status: ${response.status}`);

      // Handle redirects with authentication preservation
      if (response.status === 301 || response.status === 302) {
        if (!response.headers.location) {
          console.error(`[ApiService] Redirect without location header`);
          return response.data;
        }

        console.log(
          `[ApiService] Handling redirect to ${response.headers.location}`
        );
        let redirectUrl = response.headers.location;

        // If it's a relative URL, make it absolute
        if (!redirectUrl.startsWith("http")) {
          // Handle absolute paths (starting with /)
          if (redirectUrl.startsWith("/")) {
            const baseUrlParts = this.baseUrl.split("/");
            const baseWithoutPath = baseUrlParts.slice(0, 3).join("/"); // e.g., http://192.168.1.32:8000
            redirectUrl = `${baseWithoutPath}${redirectUrl}`;
          } else {
            // Handle relative paths
            redirectUrl = `${this.baseUrl}/${redirectUrl}`;
          }
        }

        console.log(`[ApiService] Redirecting with auth to: ${redirectUrl}`);

        // Create a new config with the redirect URL but keep all other settings
        const redirectConfig = {
          ...config,
          url: redirectUrl,
        };

        // Explicitly ensure the Authorization header is set
        if (token && !redirectConfig.headers.Authorization) {
          redirectConfig.headers.Authorization = `Token ${token}`;
        }

        console.log(
          `[ApiService] Redirect headers:`,
          JSON.stringify(redirectConfig.headers)
        );

        // Follow the redirect manually
        const redirectResponse = await this.apiClient(redirectConfig);
        return redirectResponse.data;
      }

      return response.data;
    } catch (error) {
      // Handle different error scenarios
      if (error.response) {
        // Server responded with an error status code
        console.error(
          `[ApiService] Error ${error.response.status} from ${
            error.config?.url || "unknown URL"
          }`
        );

        if (error.response.status === 401) {
          console.error(
            "[ApiService] Authentication error. Please log in again."
          );
        }

        // Return empty object instead of throwing to prevent UI errors
        console.error("[ApiService] Error details:", error.message);
        return {};
      } else if (error.request) {
        // Request was made but no response received
        console.error("[ApiService] No response received:", error.request);
        return {};
      } else {
        // Error setting up the request
        console.error("[ApiService] Error:", error.message);
        return {};
      }
    }
  }

  /**
   * Sets authentication tokens in storage and updates authorization headers
   * @param {Object} tokens - The auth tokens
   * @param {string} tokens.accessToken - JWT access token
   * @param {string} tokens.refreshToken - JWT refresh token
   * @param {Object} user - User data to store
   * @public
   */
  async setAuth(tokens, user = null) {
    if (tokens?.accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
      this.apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${tokens.accessToken}`;
    }

    if (tokens?.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    if (user) {
      await SecureStore.setItemAsync("user", JSON.stringify(user));
    }
  }

  /**
   * Gets the current access token
   * @returns {string|null} The access token or null
   * @public
   */
  async getAccessToken() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  /**
   * Gets the current user data
   * @returns {Object|null} User data or null
   * @public
   */
  async getUser() {
    const userData = await SecureStore.getItemAsync("user");
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Checks if the user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   * @public
   */
  async isAuthenticated() {
    return !!(await this.getAccessToken());
  }

  /**
   * Clears all authentication data
   * @public
   */
  async clearAuth() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync("user");
    delete this.apiClient.defaults.headers.common["Authorization"];
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns {Promise<boolean>} True if refresh was successful
   * @private
   */
  async _refreshToken() {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      // Using the base axios instance directly to avoid authorization loops
      const response = await axios.post(`${this.baseUrl}/auth/refresh`, {
        refreshToken,
      });

      if (response.data?.accessToken) {
        await this.setAuth({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken || refreshToken,
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

  /**
   * Setup axios interceptors for authentication and error handling
   * @private
   */
  _setupInterceptors() {
    // Request interceptor to add the auth token
    this.apiClient.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh on 401 errors
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh the token
          const refreshed = await this._refreshToken();

          if (refreshed) {
            // Retry the original request with new token
            return this.apiClient(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

// Export a single ApiService instance as Singleton
export const apiService = new ApiService();

export default apiService;
