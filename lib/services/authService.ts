import {
  supabase,
  getCurrentUser,
  createUserProfile,
  getUserProfile,
} from "./supabase";
import { AuthUser, UserInsert, UserRow } from "../types/database";
import { User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthResponse {
  user: User;
  session: any;
}

export interface GoogleSignInRequest {
  idToken: string;
  accessToken: string;
}

export interface GoogleSignInResponse {
  message: string;
  email: string;
  name: string;
  requiresOTP?: boolean;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface SendOTPResponse {
  message: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
  googleProfile?: {
    email: string;
    name: string;
    avatar_url?: string;
  };
}

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth service
  async initialize(): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        console.log("Qred: User session restored");
      }
    } catch (error) {
      console.error("Qred Auth: Initialization error:", error);
    }
  }

  // Google Sign-In (Step 1)
  async googleSignIn(
    request: GoogleSignInRequest,
  ): Promise<GoogleSignInResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: request.idToken,
        access_token: request.accessToken,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user profile exists
        try {
          await getUserProfile(data.user.id);
          // Profile exists, user is fully registered
          return {
            message: "Google sign-in successful",
            email: data.user.email || "",
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              "",
          };
        } catch (profileError) {
          // Profile doesn't exist, needs phone verification
          return {
            message: "Google account linked, phone verification required",
            email: data.user.email || "",
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              "",
            requiresOTP: true,
          };
        }
      }

      throw new Error("Google sign-in failed");
    } catch (error: any) {
      console.error("Qred Auth: Google sign-in error:", error);
      throw new Error(error.message || "Google sign-in failed");
    }
  }

  // Send OTP for phone verification
  async sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      // Format phone number (ensure it starts with +)
      let formattedPhone = request.phoneNumber;
      if (!formattedPhone.startsWith("+")) {
        // Assume Nigerian number if no country code
        formattedPhone = `+234${formattedPhone.replace(/^0/, "")}`;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      return {
        message: "OTP sent successfully",
      };
    } catch (error: any) {
      console.error("Qred Auth: Send OTP error:", error);
      throw new Error(error.message || "Failed to send OTP");
    }
  }

  // Verify OTP and complete registration
  async verifyOTP(request: VerifyOTPRequest): Promise<AuthResponse> {
    try {
      // Format phone number
      let formattedPhone = request.phoneNumber;
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+234${formattedPhone.replace(/^0/, "")}`;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: request.otp,
        type: "sms",
      });

      if (error) throw error;

      if (!data.user || !data.session) {
        throw new Error("Verification failed");
      }

      // Check if user profile exists, create if not
      let userProfile: UserRow;
      try {
        userProfile = await getUserProfile(data.user.id);
      } catch (profileError) {
        // Create user profile
        const profileData: UserInsert = {
          id: data.user.id,
          name:
            request.googleProfile?.name ||
            data.user.user_metadata?.name ||
            "Qred User",
          email: request.googleProfile?.email || data.user.email || null,
          phoneNumber: formattedPhone,
          avatarUrl:
            request.googleProfile?.avatar_url ||
            data.user.user_metadata?.avatar_url ||
            null,
        };

        userProfile = await createUserProfile(profileData);
      }

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.error("Qred Auth: Verify OTP error:", error);
      throw new Error(error.message || "OTP verification failed");
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage
      await AsyncStorage.multiRemove([
        "qred_user_preferences",
        "qred_debt_cache",
      ]);

      console.log("Qred: User signed out successfully");
    } catch (error: any) {
      console.error("Qred Auth: Sign out error:", error);
      throw new Error(error.message || "Sign out failed");
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      return await getCurrentUser();
    } catch (error) {
      console.error("Qred Auth: Get current user error:", error);
      return null;
    }
  }

  // Get stored user profile
  async getStoredUser(): Promise<UserRow | null> {
    try {
      const authUser = await getCurrentUser();
      if (!authUser) return null;

      return await getUserProfile(authUser.id);
    } catch (error) {
      console.error("Qred Auth: Get stored user error:", error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<UserRow>): Promise<UserRow> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { data, error } = await supabase
        .from("User")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error("Qred Auth: Update profile error:", error);
      throw new Error(error.message || "Profile update failed");
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error) {
      console.error("Qred Auth: Is authenticated error:", error);
      return false;
    }
  }

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error("Qred Auth: Get auth token error:", error);
      return null;
    }
  }

  // Refresh session
  async refreshSession(): Promise<void> {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (error: any) {
      console.error("Qred Auth: Refresh session error:", error);
      throw new Error(error.message || "Session refresh failed");
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Handle deep link auth (for OAuth providers)
  async handleAuthCallback(url: string): Promise<boolean> {
    try {
      // Parse URL for session data (manual parsing since getSessionFromUrl is deprecated)
      const url_obj = new URL(url);
      const access_token = url_obj.searchParams.get("access_token");
      const refresh_token = url_obj.searchParams.get("refresh_token");

      if (!access_token) {
        return false;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || "",
      });

      if (error) {
        console.error("Qred Auth: Callback error:", error);
        return false;
      }

      if (data.session) {
        console.log("Qred Auth: Successfully authenticated via callback");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Qred Auth: Handle callback error:", error);
      return false;
    }
  }

  // Reset password (for email users)
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "qred://auth/reset-password",
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Qred Auth: Reset password error:", error);
      throw new Error(error.message || "Password reset failed");
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Qred Auth: Update password error:", error);
      throw new Error(error.message || "Password update failed");
    }
  }

  // Delete account
  async deleteAccount(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Note: This requires a custom database function to be created
      // For now, we'll just sign out the user
      console.warn(
        "Account deletion not implemented - requires custom RPC function",
      );
      await this.signOut();
    } catch (error: any) {
      console.error("Qred Auth: Delete account error:", error);
      throw new Error(error.message || "Account deletion failed");
    }
  }

  // Validation helper methods
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check Nigerian phone number format
    const nigerianPhoneRegex = /^(\+234|234|0)?[7-9][0-9]\d{8}$/;

    return nigerianPhoneRegex.test(cleanPhone);
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // Handle different formats
    if (cleaned.startsWith("+234")) {
      return cleaned;
    } else if (cleaned.startsWith("234")) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `+234${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+234${cleaned}`;
    }

    return cleaned;
  }

  validateOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
