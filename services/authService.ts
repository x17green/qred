import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  GoogleSignInRequest,
  GoogleSignInResponse,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  User
} from '@/types';
import { STORAGE_KEYS } from '@/constants';

class AuthService {
  /**
   * Sign in with Google OAuth token
   */
  async googleSignIn(request: GoogleSignInRequest): Promise<GoogleSignInResponse> {
    try {
      const response = await api.post<GoogleSignInResponse>('/auth/google-signin', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      const response = await api.post<SendOTPResponse>('/auth/send-otp', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify OTP and complete authentication
   */
  async verifyOTP(request: VerifyOTPRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-otp', request);

      // Store auth data locally
      if (response.token && response.user) {
        await this.storeAuthData(response.token, response.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/users/me');

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response));

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch<User>('/users/me', data);

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response));

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      // Call logout endpoint if available
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Continue with local logout even if server logout fails
        console.warn('Server logout failed:', error);
      }

      // Clear local storage
      await this.clearAuthData();

      // Clear API auth token
      api.clearAuthToken();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh');

      if (response.token && response.user) {
        await this.storeAuthData(response.token, response.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      return !!(token && userData);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get stored authentication token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Store authentication data locally
   */
  private async storeAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);

      // Set token in API service
      api.setAuthToken(token);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Clear stored authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Check Nigerian phone number format
    const nigerianPhoneRegex = /^(\+234|234|0)?[7-9][0-1]\d{8}$/;

    return nigerianPhoneRegex.test(cleanPhone);
  }

  /**
   * Format phone number to standard format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+234')) {
      return cleaned;
    } else if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+234${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+234${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Validate OTP format
   */
  validateOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Initialize auth service (call on app startup)
   */
  async initialize(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (token) {
        api.setAuthToken(token);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
