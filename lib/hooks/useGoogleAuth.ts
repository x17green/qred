import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/authStore";

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
}

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (
  config?: GoogleAuthConfig,
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLoading, setError: setAuthError } = useAuthStore();

  // Configure Google OAuth for React Native
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      config?.iosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId:
      config?.androidClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId:
      config?.webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
    // For React Native, we don't need a custom redirect URI
    // Expo handles this automatically
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.params.id_token);
    } else if (response?.type === "error") {
      setError("Google sign-in was cancelled or failed");
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setLoading(true);
      setAuthError(null);

      // Use signInWithIdToken as per Supabase React Native docs
      const result = await authService.googleSignIn({
        idToken,
      });

      if (result.requiresOTP) {
        // Google account linked but needs phone verification
        setError("Phone verification required to complete setup");
      } else {
        console.log("Qred: Google sign-in successful");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Google sign-in failed";
      setError(errorMessage);
      setAuthError(errorMessage);
      console.error("Qred Google Auth Error:", err);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!request) {
        throw new Error("Google OAuth not configured properly");
      }

      // Check if Google Play Services are available (Android)
      if (Platform.OS === "android") {
        // Note: You might want to add Google Play Services check here
        // using a library like react-native-google-signin
      }

      await promptAsync();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to initialize Google sign-in";
      setError(errorMessage);
      setIsLoading(false);
      console.error("Qred Google Auth Init Error:", err);
    }
  };

  const clearError = () => {
    setError(null);
    setAuthError(null);
  };

  return {
    signInWithGoogle,
    isLoading,
    error,
    clearError,
  };
};

export default useGoogleAuth;
