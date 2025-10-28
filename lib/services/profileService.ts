import { UserInsert, UserRow, UserUpdate } from "../types/database";
import { getCurrentUser, supabase } from "./supabase";

class ProfileService {
  private static instance: ProfileService;

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Safely retrieves a user profile by ID
   * Returns null if profile doesn't exist (instead of throwing error)
   */
  async getProfile(userId?: string): Promise<UserRow | null> {
    try {
      const targetUserId = userId || (await getCurrentUser())?.id;

      if (!targetUserId) {
        console.warn("ProfileService: No user ID provided and no authenticated user found");
        return null;
      }

      const { data, error } = await supabase
        .from("User")
        .select("*")
        .eq("id", targetUserId)
        .maybeSingle();

      if (error) {
        console.error("ProfileService: Error fetching profile:", error);
        throw error;
      }

      return data; // Can be null if no profile exists
    } catch (error) {
      console.error("ProfileService: Get profile failed:", error);
      throw error;
    }
  }

  /**
   * Creates or updates a user profile with robust error handling
   * Handles race conditions and duplicate key violations gracefully
   */
  async createOrUpdateProfile(profileData: UserInsert): Promise<UserRow> {
    try {
      // First, check if profile already exists
      const existingProfile = await this.getProfile(profileData.id);

      if (existingProfile) {
        // Profile exists, update it
        console.log("ProfileService: Profile exists, updating...");
        return await this.updateProfile(profileData.id, {
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          avatarUrl: profileData.avatarUrl,
        });
      } else {
        // Profile doesn't exist, create it
        console.log("ProfileService: Creating new profile...");
        return await this.createProfile(profileData);
      }
    } catch (error) {
      console.error("ProfileService: Create or update profile failed:", error);
      throw error;
    }
  }

  /**
   * Creates a new user profile with duplicate key handling
   */
  private async createProfile(profileData: UserInsert): Promise<UserRow> {
    try {
      const { data, error } = await supabase
        .from("User")
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // Handle duplicate key error (race condition)
        if (error.code === "23505") {
          console.log("ProfileService: Duplicate key detected, fetching existing profile...");

          // Check which constraint was violated
          if (error.message.includes("User_pkey")) {
            // Primary key conflict - profile was created by another request
            const existingProfile = await this.getProfile(profileData.id);
            if (existingProfile) {
              return existingProfile;
            }
          } else if (error.message.includes("User_email_key")) {
            // Email conflict - find profile by email
            const { data: existingByEmail } = await supabase
              .from("User")
              .select("*")
              .eq("email", profileData.email || "")
              .maybeSingle();

            if (existingByEmail) {
              return existingByEmail;
            }
          } else if (error.message.includes("User_phoneNumber_key")) {
            // Phone number conflict - clear phone number and retry
            console.log("ProfileService: Phone number conflict, creating without phone...");
            const profileWithoutPhone = { ...profileData, phoneNumber: null };
            return await this.createProfile(profileWithoutPhone);
          }
        }

        console.error("ProfileService: Profile creation failed:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Profile creation returned no data");
      }

      return data;
    } catch (error) {
      console.error("ProfileService: Create profile error:", error);
      throw error;
    }
  }

  /**
   * Updates an existing user profile
   */
  async updateProfile(userId: string, updates: UserUpdate): Promise<UserRow> {
    try {
      const { data, error } = await supabase
        .from("User")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violations during update
        if (error.code === "23505") {
          if (error.message.includes("User_phoneNumber_key")) {
            console.log("ProfileService: Phone number already exists, clearing phone number...");
            const updatesWithoutPhone = { ...updates, phoneNumber: null };
            return await this.updateProfile(userId, updatesWithoutPhone);
          }
        }

        console.error("ProfileService: Profile update failed:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Profile update returned no data");
      }

      return data;
    } catch (error) {
      console.error("ProfileService: Update profile error:", error);
      throw error;
    }
  }

  /**
   * Ensures a profile exists for the current authenticated user
   * Creates a minimal profile if none exists
   */
  async ensureCurrentUserProfile(): Promise<UserRow | null> {
    try {
      const authUser = await getCurrentUser();
      if (!authUser) {
        console.warn("ProfileService: No authenticated user found");
        return null;
      }

      let profile = await this.getProfile(authUser.id);

      if (!profile) {
        console.log("ProfileService: No profile found, creating minimal profile...");

        // Create minimal profile from auth user data
        const profileData: UserInsert = {
          id: authUser.id,
          name: this.extractNameFromAuthUser(authUser),
          email: authUser.email || null,
          phoneNumber: authUser.phone || null,
          avatarUrl: authUser.user_metadata?.avatar_url || null,
        };

        profile = await this.createOrUpdateProfile(profileData);
      }

      return profile;
    } catch (error) {
      console.error("ProfileService: Ensure profile failed:", error);
      return null; // Return null instead of throwing to allow app to continue
    }
  }

  /**
   * Checks if a profile is complete (has required fields)
   */
  isProfileComplete(profile: UserRow | null): boolean {
    if (!profile) return false;

    // Check if essential profile fields are completed
    const hasName = profile.name &&
                   profile.name.trim() !== "" &&
                   profile.name !== "User" &&
                   profile.name !== "Qred User" &&
                   !profile.name.includes("@"); // Not an email-based name

    return !!hasName;
  }

  /**
   * Updates user avatar URL
   */
  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserRow> {
    return await this.updateProfile(userId, { avatarUrl });
  }

  /**
   * Updates user phone number with conflict handling
   */
  async updatePhoneNumber(userId: string, phoneNumber: string | null): Promise<UserRow> {
    try {
      return await this.updateProfile(userId, { phoneNumber });
    } catch (error: any) {
      if (error.code === "23505" && error.message.includes("User_phoneNumber_key")) {
        throw new Error("This phone number is already associated with another account");
      }
      throw error;
    }
  }

  /**
   * Safely deletes a user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("User")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error("ProfileService: Profile deletion failed:", error);
        throw error;
      }

      console.log("ProfileService: Profile deleted successfully");
    } catch (error) {
      console.error("ProfileService: Delete profile error:", error);
      throw error;
    }
  }

  /**
   * Extracts a reasonable name from auth user data
   */
  private extractNameFromAuthUser(authUser: any): string {
    // Try various sources for user name
    const possibleNames = [
      authUser.user_metadata?.name,
      authUser.user_metadata?.full_name,
      authUser.user_metadata?.display_name,
      authUser.email?.split("@")[0],
      "User"
    ];

    for (const name of possibleNames) {
      if (name && typeof name === "string" && name.trim() !== "") {
        return name.trim();
      }
    }

    return "User";
  }

  /**
   * Validates phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    // Remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check Nigerian phone number format
    const nigerianPhoneRegex = /^(\+234|234|0)?[7-9][0-9]\d{8}$/;

    return nigerianPhoneRegex.test(cleanPhone);
  }

  /**
   * Formats phone number to standard format
   */
  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return "";

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

  /**
   * Searches for profiles by email or phone (admin function)
   */
  async findProfileByContact(email?: string, phoneNumber?: string): Promise<UserRow | null> {
    try {
      let query = supabase.from("User").select("*");

      if (email && phoneNumber) {
        query = query.or(`email.eq.${email},phoneNumber.eq.${phoneNumber}`);
      } else if (email) {
        query = query.eq("email", email);
      } else if (phoneNumber) {
        query = query.eq("phoneNumber", phoneNumber);
      } else {
        return null;
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("ProfileService: Find profile by contact failed:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("ProfileService: Find profile by contact error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();
export default profileService;
