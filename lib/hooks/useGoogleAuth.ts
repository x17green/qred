import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
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

  // Generate dynamic redirect URI using Linking.createURL()
  const redirectUri = Linking.createURL("auth/google");

  // Configure Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      config?.iosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId:
      config?.androidClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId:
      config?.webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(
        response.params.id_token,
        response.params.access_token,
      );
    } else if (response?.type === "error") {
      setError("Google sign-in was cancelled or failed");
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string, accessToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setLoading(true);
      setAuthError(null);

      const result = await authService.googleSignIn({
        idToken,
        accessToken: accessToken || idToken,
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

      // Log the redirect URI for debugging
      console.log("Qred: Using redirect URI:", redirectUri);

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
