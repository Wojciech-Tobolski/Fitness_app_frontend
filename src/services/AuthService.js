import apiService from "./ApiService";

/**
 * Service handling authentication operations
 */
class AuthService {
  /**
   * Get the current authentication token
   * @returns {Promise<string|null>} The token or null if not authenticated
   */
  async getToken() {
    try {
      return await apiService.getToken();
    } catch (error) {
      console.log("[AuthService] Error getting token:", error);
      return null;
    }
  }

  /**
   * Authenticates a user with username and password
   * @param {string} username - The user's username
   * @param {string} password - The user's password
   * @returns {Promise<Object>} Authentication result with tokens and user data
   */
  async login(username, password) {
    try {
      console.log(`[AuthService] Login attempt: ${username}`);
      // Auth endpoint uses Django's token authentication
      const response = await apiService.post("/auth", {
        username,
        password,
      });

      if (response && response.token) {
        // Store token using the ApiService method
        await apiService.setAuthTokens(response.token, null);

        return {
          success: true,
          user: { username },
        };
      } else {
        console.error("[AuthService] Login failed: Invalid response format");
        return {
          success: false,
          error: "Błędne dane logowania",
        };
      }
    } catch (error) {
      console.error("[AuthService] Login error:", error);

      // Always return same simple error message regardless of actual error
      return {
        success: false,
        error: "Błędne dane logowania",
      };
    }
  }

  /**
   * Logs out the current user
   * @returns {Promise<boolean>} Success status
   */
  async logout() {
    try {
      // Clear tokens from storage (no server call needed)
      await apiService.clearToken();
      console.log("[AuthService] Logout successful");
      return true;
    } catch (error) {
      console.error("[AuthService] Logout error:", error);
      // Return success anyway to ensure user is logged out on the client
      return true;
    }
  }

  /**
   * Fetches data of the currently logged in user
   * @returns {Promise<Object|null>} User data or null if not authenticated
   */
  async getCurrentUser() {
    try {
      const token = await this.getToken();

      if (!token) {
        console.log("[AuthService] No token available to get user data");
        return null;
      }

      const userData = await apiService.get("/user/current/");
      console.log("[AuthService] Current user data retrieved");

      return userData;
    } catch (error) {
      console.error("[AuthService] Error fetching current user:", error);

      // Handle 401 errors - token expired
      if (error.response && error.response.status === 401) {
        console.log("[AuthService] Session expired, clearing token");
        await apiService.clearToken();
      }

      // Return default user object to prevent UI errors
      return { username: "Użytkownik" };
    }
  }

  /**
   * Registers a new user
   * @param {Object} userData User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await apiService.post("/auth/register/", userData);
      console.log("[AuthService] Registration successful");

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error("[AuthService] Registration error:", error);

      // Extract error messages from API response
      let errorMessages = {};

      if (error.response && error.response.data) {
        errorMessages = error.response.data;
      }

      return {
        success: false,
        errors: errorMessages,
      };
    }
  }

  /**
   * Requests a password reset
   * @param {string} email User's email
   * @returns {Promise<Object>} Request result
   */
  async requestPasswordReset(email) {
    try {
      await apiService.post("/auth/password-reset/", { email });
      return { success: true };
    } catch (error) {
      console.error("[AuthService] Password reset request error:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to request password reset",
      };
    }
  }

  /**
   * Confirms a password reset
   * @param {string} token Reset token
   * @param {string} password New password
   * @returns {Promise<Object>} Reset result
   */
  async confirmPasswordReset(token, password) {
    try {
      await apiService.post("/auth/password-reset/confirm/", {
        token,
        password,
      });
      return { success: true };
    } catch (error) {
      console.error("[AuthService] Password reset confirmation error:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to reset password",
      };
    }
  }

  /**
   * Sets the authentication token
   * @param {string} token Authentication token
   * @returns {Promise<void>}
   */
  async setToken(token) {
    try {
      console.log("[AuthService] Setting token");
      await apiService.setAuthTokens(token, null);
    } catch (error) {
      console.error("[AuthService] Error setting token:", error);
    }
  }
}

// Export a single instance as Singleton
export const authService = new AuthService();

export default authService;
