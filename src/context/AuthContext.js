import { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const bootstrapAsync = async () => {
      try {
        // Try to get token from authService
        let token = null;
        try {
          token = await authService.getToken();
        } catch (e) {
          console.log("No stored token found, user needs to log in");
        }

        if (token) {
          setUserToken(token);
          // Fetch user data
          try {
            const user = await authService.getCurrentUser();
            setUserData(user);
          } catch (e) {
            console.log("Failed to get user data, clearing token");
            // Invalid token or other issue
            await authService.logout();
            setUserToken(null);
          }
        }
      } catch (e) {
        // Just log the error without showing to user
        console.log("Auth state restoration skipped");
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (username, password) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await authService.login(username, password);

        if (result.success) {
          setUserToken(result.token);

          // Fetch user data after successful login
          try {
            console.log("[AuthContext] Login successful, fetching user data");
            const user = await authService.getCurrentUser();
            setUserData(user);
          } catch (e) {
            console.log(
              "[AuthContext] Failed to fetch user data after login:",
              e
            );
          }

          return { success: true };
        } else {
          setError(result.error || "Błędne dane logowania");
          return {
            success: false,
            error: result.error || "Błędne dane logowania",
          };
        }
      } catch (e) {
        console.error("[AuthContext] Login error:", e);

        // Always return same error message regardless of actual error
        const errorMessage = "Błędne dane logowania";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },

    signOut: async () => {
      setIsLoading(true);
      try {
        await authService.logout();
        setUserToken(null);
        setUserData(null);
      } catch (e) {
        console.error("[AuthContext] Logout error:", e);
      } finally {
        setIsLoading(false);
      }
    },

    isLoading,
    userToken,
    userData,
    error,
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
