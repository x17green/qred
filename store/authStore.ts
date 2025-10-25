import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AuthState, AuthActions } from "@/types";
import { authService } from "@/services/authService";
import { STORAGE_KEYS } from "@/constants";

interface AuthStore extends AuthState, AuthActions {
  // Additional auth actions
  signIn: (
    phoneNumber: string,
    otp: string,
    googleProfile?: { email: string; name: string },
  ) => Promise<any>;
  sendOTP: (phoneNumber: string) => Promise<any>;
  googleSignIn: (googleToken: string) => Promise<any>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<User>;
  checkAuthStatus: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true, error: null });
      },

      setToken: (token: string) => {
        set({ token, error: null });
        authService.initialize();
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          await authService.signOut();

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
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

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
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

      googleSignIn: async (googleToken: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.googleSignIn({ googleToken });

          set({ isLoading: false });
          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Google sign in failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });

          const updatedUser = await authService.updateProfile(data);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
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

          const user = await authService.getCurrentUser();

          set({
            user,
            isLoading: false,
            error: null,
          });

          return user;
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
            const [token, user] = await Promise.all([
              authService.getAuthToken(),
              authService.getStoredUser(),
            ]);

            if (token && user) {
              set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return true;
            }
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
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
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Selectors for easier component usage
export const useAuth = () =>
  useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
  }));

export const useAuthActions = () =>
  useAuthStore((state) => ({
    setUser: state.setUser,
    setToken: state.setToken,
    signOut: state.signOut,
    signIn: state.signIn,
    sendOTP: state.sendOTP,
    googleSignIn: state.googleSignIn,
    updateProfile: state.updateProfile,
    refreshUser: state.refreshUser,
    checkAuthStatus: state.checkAuthStatus,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset,
  }));

export default useAuthStore;
