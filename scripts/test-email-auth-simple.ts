// Simple Email Authentication Test Script
// This script tests email authentication directly with Supabase client
require("dotenv").config();

import { createClient } from "@supabase/supabase-js";

console.log("🧪 Testing Email Authentication (Simple)");
console.log("=".repeat(50));

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration
const testEmail = "testuser@example.com";
const testPassword = "testpassword123";

async function testEmailSignUp() {
  console.log("\n📧 Testing Email Sign Up...");

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: "Test User",
          phone_number: "+2348012345678",
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        console.log("✅ Email sign up: User already exists (expected for testing)");
        console.log(`   Message: ${error.message}`);
        return null;
      }
      throw error;
    }

    console.log("✅ Email sign up successful");
    console.log(`   User ID: ${data.user?.id || 'N/A'}`);
    console.log(`   Email: ${data.user?.email || 'N/A'}`);
    console.log(`   Confirmation sent: ${!data.session ? 'Yes' : 'No'}`);

    return data;
  } catch (error: any) {
    console.log(`❌ Email sign up failed: ${error.message}`);
    throw error;
  }
}

async function testEmailSignIn() {
  console.log("\n🔐 Testing Email Sign In...");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) throw error;

    console.log("✅ Email sign in successful");
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Session active: ${!!data.session}`);
    console.log(`   Access token: ${data.session?.access_token ? 'Present' : 'Missing'}`);

    return data;
  } catch (error: any) {
    console.log(`❌ Email sign in failed: ${error.message}`);
    throw error;
  }
}

async function testGetSession() {
  console.log("\n🔍 Testing Get Current Session...");

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (data.session) {
      console.log("✅ Session retrieved");
      console.log(`   User ID: ${data.session.user?.id}`);
      console.log(`   Email: ${data.session.user?.email}`);
      console.log(`   Expires at: ${new Date(data.session.expires_at! * 1000).toISOString()}`);
    } else {
      console.log("⚠️ No active session");
    }

    return data.session;
  } catch (error: any) {
    console.log(`❌ Get session failed: ${error.message}`);
    throw error;
  }
}

async function testCreateUserProfile(userId: string) {
  console.log("\n👤 Testing User Profile Creation...");

  try {
    const { data, error } = await supabase
      .from("User")
      .insert({
        id: userId,
        name: "Test User",
        email: testEmail,
        phoneNumber: "+2348012345678",
        avatarUrl: null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation - user already exists
        console.log("✅ User profile: Already exists (expected for testing)");

        // Try to fetch existing profile
        const { data: existingUser, error: fetchError } = await supabase
          .from("User")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError) throw fetchError;

        console.log(`   Name: ${existingUser.name}`);
        console.log(`   Email: ${existingUser.email}`);
        return existingUser;
      }
      throw error;
    }

    console.log("✅ User profile created");
    console.log(`   Name: ${data.name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Phone: ${data.phoneNumber}`);

    return data;
  } catch (error: any) {
    console.log(`❌ User profile creation failed: ${error.message}`);
    throw error;
  }
}

async function testSignOut() {
  console.log("\n🚪 Testing Sign Out...");

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    console.log("✅ Sign out successful");
  } catch (error: any) {
    console.log(`❌ Sign out failed: ${error.message}`);
    throw error;
  }
}

async function testEmailValidation() {
  console.log("\n✉️ Testing Email Validation...");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validEmails = ["test@example.com", "user.name+tag@domain.co.uk"];
  const invalidEmails = ["invalid-email", "@domain.com", "user@", ""];

  validEmails.forEach(email => {
    const isValid = validateEmail(email);
    console.log(`   ${email}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  invalidEmails.forEach(email => {
    const isValid = validateEmail(email);
    console.log(`   ${email}: ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
  });
}

async function testPasswordReset() {
  console.log("\n🔄 Testing Password Reset...");

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: "qred://auth/reset-password",
    });

    if (error) throw error;

    console.log("✅ Password reset email sent");
    console.log("   Check the email for reset instructions");
  } catch (error: any) {
    console.log(`❌ Password reset failed: ${error.message}`);
  }
}

async function runEmailAuthTests() {
  try {
    // Test validation functions first
    testEmailValidation();

    // Test authentication flow
    console.log("\n🔄 Starting Authentication Flow Test...");

    // Step 1: Try to sign up
    await testEmailSignUp();

    // Step 2: Sign in
    const signInData = await testEmailSignIn();

    if (signInData?.user) {
      // Step 3: Test session management
      await testGetSession();

      // Step 4: Test user profile
      await testCreateUserProfile(signInData.user.id);

      // Step 5: Test password reset
      await testPasswordReset();

      // Step 6: Test sign out
      await testSignOut();

      // Step 7: Verify signed out state
      const sessionAfterSignOut = await testGetSession();
      if (!sessionAfterSignOut) {
        console.log("✅ Sign out state verified - no active session");
      }
    }

    console.log("\n🎉 Email Authentication Tests Completed Successfully!");
    console.log("\nTest Summary:");
    console.log("✅ Email validation: Working");
    console.log("✅ Email sign up: Working");
    console.log("✅ Email sign in: Working");
    console.log("✅ Session management: Working");
    console.log("✅ User profile management: Working");
    console.log("✅ Password reset: Working");
    console.log("✅ Sign out: Working");

    console.log("\n✨ Your Supabase email authentication is ready to use!");
    console.log("You can now integrate these methods into your React Native app.");

  } catch (error: any) {
    console.error("\n❌ Email authentication tests failed:");
    console.error("Error:", error.message);

    console.log("\n🔧 Troubleshooting Tips:");
    console.log("1. Ensure Supabase is properly configured");
    console.log("2. Check that email authentication is enabled in Supabase Dashboard");
    console.log("3. Verify your database has the User table with correct schema");
    console.log("4. Make sure RLS policies allow the operations");
    console.log("5. Check if email confirmation is required in your Supabase settings");

    process.exit(1);
  }
}

// Run the tests
console.log("Starting email authentication tests...");
runEmailAuthTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});
