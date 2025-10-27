import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";
import { Database } from "../types/database";

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Check if environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.",
  );
}

// Create Supabase client with platform-specific storage
const storage =
  Platform.OS === "web"
    ? typeof window !== "undefined"
      ? window.localStorage
      : AsyncStorage
    : AsyncStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": `qred-${Platform.OS}@1.0.0`,
    },
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  return user;
};

// Helper function to get current session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting current session:", error);
    return null;
  }
  return session;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session?.user;
};

// Helper function to get user profile from public.users table
export const getUserProfile = async (userId?: string) => {
  const targetUserId = userId || (await getCurrentUser())?.id;

  if (!targetUserId) {
    throw new Error("No user ID provided and no authenticated user found");
  }

  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }

  // Return null if no profile found (instead of throwing error)
  return data;
};

// Helper function to update user profile
export const updateUserProfile = async (
  updates: Partial<Database["public"]["Tables"]["User"]["Update"]>,
) => {
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

  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }

  return data;
};

// Helper function to create or update user profile (handles duplicates gracefully)
export const createUserProfile = async (
  profileData: Database["public"]["Tables"]["User"]["Insert"],
) => {
  try {
    // First, try to get existing profile
    const existingProfile = await getUserProfile(profileData.id);

    if (existingProfile) {
      // Profile exists, update it
      console.log("Profile exists, updating...");
      const { data, error } = await supabase
        .from("User")
        .update({
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          avatarUrl: profileData.avatarUrl,
        })
        .eq("id", profileData.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }

      return data;
    } else {
      // Profile doesn't exist, create it
      console.log("Profile doesn't exist, creating...");
      const { data, error } = await supabase
        .from("User")
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // Handle duplicate key error (race condition)
        if (error.code === "23505") {
          console.log("Duplicate key detected during creation, fetching existing profile...");
          const existingProfile = await getUserProfile(profileData.id);
          if (existingProfile) {
            return existingProfile;
          }
        }
        console.error("Error creating user profile:", error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    throw error;
  }
};

// Real-time subscription helpers
export const subscribeToUserDebts = (
  userId: string,
  callback: (payload: any) => void,
) => {
  return supabase
    .channel("user-debts")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Debt",
        filter: `or(lenderId.eq.${userId},debtorId.eq.${userId})`,
      },
      callback,
    )
    .subscribe();
};

export const subscribeToPayments = (callback: (payload: any) => void) => {
  return supabase
    .channel("payments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Payment",
      },
      callback,
    )
    .subscribe();
};

// Error handling helper
export const handleSupabaseError = (error: any): never => {
  console.error("Supabase error:", error);

  if (error.message) {
    throw new Error(error.message);
  }

  if (error.details) {
    throw new Error(error.details);
  }

  throw new Error("An unexpected database error occurred");
};

export default supabase;
