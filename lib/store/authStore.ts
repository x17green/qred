import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
    AuthResponse,
    authService,
    EmailSignInRequest,
    EmailSignInResponse,
    EmailSignUpRequest,
    EmailSignUpResponse,
} from "../services/authService";
import { UserRow } from "../types/database";

interface AuthState {
  user: UserRow | null;
  authUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsOnboarding: boolean;
}

interface AuthActions {
  setUser: (user: UserRow) => void;
  setAuthUser: (user: User) => void;
  setToken: (token: string) => void;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsOnboarding: (needsOnboarding: boolean) => void;
  checkProfileCompletion: () => boolean;
}

interface AuthStore extends AuthState, AuthActions {
  // Additional auth actions
  signIn: (
    phoneNumber: string,
    otp: string,
    googleProfile?: { email: string; name: string },
  ) => Promise<AuthResponse>;
  sendOTP: (phoneNumber: string) => Promise<any>;
  googleSignIn: (tokens: {
    idToken: string;
    accessToken: string;
  }) => Promise<any>;
  signUpWithEmail: (
    request: EmailSignUpRequest,
  ) => Promise<EmailSignUpResponse>;
  signInWithEmail: (
    request: EmailSignInRequest,
  ) => Promise<EmailSignInResponse>;
  updateProfile: (data: Partial<UserRow>) => Promise<UserRow>;
  refreshUser: () => Promise<UserRow | null>;
  checkAuthStatus: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      authUser: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      needsOnboarding: false,

      // Actions
      setUser: (user: UserRow) => {
        const needsOnboarding = !get().checkProfileCompletion();
        set({ user, isAuthenticated: true, error: null, needsOnboarding });
      },

      setAuthUser: (user: User) => {
        set({ authUser: user, error: null });
      },

      setToken: (token: string) => {
        set({ token, error: null });
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          await authService.signOut();

          set({
            user: null,
            authUser: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            needsOnboarding: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Sign out failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setNeedsOnboarding: (needsOnboarding: boolean) => {
        set({ needsOnboarding });
      },

      checkProfileCompletion: () => {
        const { user } = get();
        if (!user) return false;

        // Check if essential profile fields are completed
        const hasName = user.name && user.name.trim() !== "" && user.name !== "User" && user.name !== "Qred User";

        return !!hasName;
      },

      // Additional auth actions
      signIn: async (
        phoneNumber: string,
        otp: string,
        googleProfile?: { email: string; name: string },
      ) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.verifyOTP({
            phoneNumber,
            otp,
            googleProfile,
          });

          // Get user profile after successful auth
          const userProfile = await authService.getStoredUser();

          const needsOnboarding = !userProfile || !userProfile.name ||
            userProfile.name === "User" || userProfile.name === "Qred User";

          set({
            user: userProfile,
            authUser: response.user,
            token: response.session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            needsOnboarding,
          });

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Sign in failed";
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      sendOTP: async (phoneNumber: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.sendOTP({ phoneNumber });

          set({ isLoading: false });
          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to send OTP";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      googleSignIn: async (tokens: {
        idToken: string;
        accessToken: string;
      }) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.googleSignIn(tokens);

          set({ isLoading: false });
          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Google sign in failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signUpWithEmail: async (request: EmailSignUpRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.signUpWithEmail(request);

          // If sign up is successful and doesn't require confirmation,
          // the user might be automatically signed in
          if (response.user && !response.requiresEmailConfirmation) {
            // Get user profile after successful auth
            const userProfile = await authService.getStoredUser();
            const token = await authService.getAuthToken();

            const needsOnboarding = !userProfile || !userProfile.name ||
              userProfile.name === "User" || userProfile.name === "Qred User";

            set({
              user: userProfile,
              authUser: response.user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              needsOnboarding,
            });
          } else {
            set({ isLoading: false });
          }

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Email sign up failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signInWithEmail: async (request: EmailSignInRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.signInWithEmail(request);

          // Get user profile after successful auth
          const userProfile = await authService.getStoredUser();

          const needsOnboarding = !userProfile || !userProfile.name ||
            userProfile.name === "User" || userProfile.name === "Qred User";

          set({
            user: userProfile,
            authUser: response.user,
            token: response.session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            needsOnboarding,
          });

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Email sign in failed";
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<UserRow>) => {
        try {
          set({ isLoading: true, error: null });

          const updatedUser = await authService.updateProfile(data);

          const needsOnboarding = !get().checkProfileCompletion();

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
            needsOnboarding,
          });

          return updatedUser;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Profile update failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      refreshUser: async () => {
        try {
          set({ isLoading: true, error: null });

          const userProfile = await authService.getStoredUser();

          set({
            user: userProfile,
            isLoading: false,
            error: null,
          });

          return userProfile;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to refresh user data";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true, error: null });

          const isAuthenticated = await authService.isAuthenticated();

          if (isAuthenticated) {
            const [token, userProfile, authUser] = await Promise.all([
              authService.getAuthToken(),
              authService.getStoredUser(),
              authService.getCurrentUser(),
            ]);

            if (token && userProfile && authUser) {
              const needsOnboarding = !userProfile || !userProfile.name ||
                userProfile.name === "User" || userProfile.name === "Qred User";

              set({
                token,
                user: userProfile,
                authUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                needsOnboarding,
              });
              return true;
            }
          }

          set({
            user: null,
            authUser: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            needsOnboarding: false,
          });

          return false;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Auth status check failed";
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          user: null,
          authUser: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          needsOnboarding: false,
        });
      },
    }),
    {
      name: "qred-auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        authUser: state.authUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        needsOnboarding: state.needsOnboarding,
      }),
    },
  ),
);

// Selectors for easier component usage
export const useAuth = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      authUser: state.authUser,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      needsOnboarding: state.needsOnboarding,
    })),
  );

export const useAuthActions = () =>
  useAuthStore(
    useShallow((state) => ({
      setUser: state.setUser,
      setAuthUser: state.setAuthUser,
      setToken: state.setToken,
      signOut: state.signOut,
      signIn: state.signIn,
      sendOTP: state.sendOTP,
      googleSignIn: state.googleSignIn,
      signUpWithEmail: state.signUpWithEmail,
      signInWithEmail: state.signInWithEmail,
      updateProfile: state.updateProfile,
      refreshUser: state.refreshUser,
      checkAuthStatus: state.checkAuthStatus,
      setLoading: state.setLoading,
      setError: state.setError,
      clearError: state.clearError,
      reset: state.reset,
      setNeedsOnboarding: state.setNeedsOnboarding,
      checkProfileCompletion: state.checkProfileCompletion,
    })),
  );

export default useAuthStore;
