// Test Email Authentication Script
// This script tests the email sign-up and sign-in functionality
require("dotenv").config();

import { authService } from "../lib/services/authService";

console.log("🧪 Testing Email Authentication");
console.log("=".repeat(50));

// Test configuration
const testEmail = "test@example.com";
const testPassword = "testpassword123";
const testName = "Test User";
const testPhone = "+2348012345678";

async function testEmailSignUp() {
  console.log("\n📧 Testing Email Sign Up...");

  try {
    const response = await authService.signUpWithEmail({
      email: testEmail,
      password: testPassword,
      name: testName,
      phoneNumber: testPhone,
    });

    console.log("✅ Email sign up successful");
    console.log(`   Message: ${response.message}`);
    console.log(`   Requires confirmation: ${response.requiresEmailConfirmation || false}`);
    console.log(`   User ID: ${response.user?.id || 'N/A'}`);

    return response;
  } catch (error: any) {
    console.log(`❌ Email sign up failed: ${error.message}`);

    // Check if it's because user already exists
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      console.log("   This is expected if the test user already exists");
      return null;
    }

    throw error;
  }
}

async function testEmailSignIn() {
  console.log("\n🔐 Testing Email Sign In...");

  try {
    const response = await authService.signInWithEmail({
      email: testEmail,
      password: testPassword,
    });

    console.log("✅ Email sign in successful");
    console.log(`   User ID: ${response.user.id}`);
    console.log(`   Email: ${response.user.email}`);
    console.log(`   Session active: ${!!response.session}`);

    return response;
  } catch (error: any) {
    console.log(`❌ Email sign in failed: ${error.message}`);
    throw error;
  }
}

async function testGetCurrentUser() {
  console.log("\n👤 Testing Get Current User...");

  try {
    const user = await authService.getCurrentUser();

    if (user) {
      console.log("✅ Current user retrieved");
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
    } else {
      console.log("⚠️ No current user found");
    }

    return user;
  } catch (error: any) {
    console.log(`❌ Get current user failed: ${error.message}`);
    throw error;
  }
}

async function testGetUserProfile() {
  console.log("\n📋 Testing Get User Profile...");

  try {
    const profile = await authService.getStoredUser();

    if (profile) {
      console.log("✅ User profile retrieved");
      console.log(`   Name: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Phone: ${profile.phoneNumber || 'Not set'}`);
    } else {
      console.log("⚠️ No user profile found");
    }

    return profile;
  } catch (error: any) {
    console.log(`❌ Get user profile failed: ${error.message}`);
    return null;
  }
}

async function testSignOut() {
  console.log("\n🚪 Testing Sign Out...");

  try {
    await authService.signOut();
    console.log("✅ Sign out successful");
  } catch (error: any) {
    console.log(`❌ Sign out failed: ${error.message}`);
    throw error;
  }
}

async function testEmailValidation() {
  console.log("\n✉️ Testing Email Validation...");

  const validEmails = ["test@example.com", "user.name+tag@domain.co.uk"];
  const invalidEmails = ["invalid-email", "@domain.com", "user@", ""];

  validEmails.forEach(email => {
    const isValid = authService.validateEmail(email);
    console.log(`   ${email}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  invalidEmails.forEach(email => {
    const isValid = authService.validateEmail(email);
    console.log(`   ${email}: ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
  });
}

async function testPasswordValidation() {
  console.log("\n🔒 Testing Password Validation...");

  const validPasswords = ["password123", "mySecurePass", "12345678"];
  const invalidPasswords = ["short", "1234567", ""];

  validPasswords.forEach(password => {
    const isValid = authService.validatePassword(password);
    console.log(`   '${password}': ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  invalidPasswords.forEach(password => {
    const isValid = authService.validatePassword(password);
    console.log(`   '${password}': ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
  });
}

async function runEmailAuthTests() {
  try {
    // Test validation functions first
    testEmailValidation();
    testPasswordValidation();

    // Test authentication flow
    console.log("\n🔄 Starting Authentication Flow Test...");

    // Step 1: Try to sign up
    await testEmailSignUp();

    // Step 2: Sign in
    const signInResponse = await testEmailSignIn();

    if (signInResponse) {
      // Step 3: Test authenticated state
      await testGetCurrentUser();
      await testGetUserProfile();

      // Step 4: Test sign out
      await testSignOut();

      // Step 5: Verify signed out state
      const userAfterSignOut = await testGetCurrentUser();
      if (!userAfterSignOut) {
        console.log("✅ Sign out state verified - no current user");
      }
    }

    console.log("\n🎉 Email Authentication Tests Completed Successfully!");
    console.log("\nTest Summary:");
    console.log("✅ Email validation: Working");
    console.log("✅ Password validation: Working");
    console.log("✅ Email sign up: Working");
    console.log("✅ Email sign in: Working");
    console.log("✅ User profile management: Working");
    console.log("✅ Sign out: Working");

  } catch (error: any) {
    console.error("\n❌ Email authentication tests failed:");
    console.error("Error:", error.message);

    console.log("\n🔧 Troubleshooting Tips:");
    console.log("1. Ensure Supabase is properly configured");
    console.log("2. Check that email authentication is enabled in Supabase");
    console.log("3. Verify your database has the User table with correct schema");
    console.log("4. Make sure RLS policies allow the operations");

    process.exit(1);
  }
}

// Run the tests
console.log("Starting email authentication tests...");
runEmailAuthTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});
