import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOnboardingFlow() {
  console.log("🚀 Testing Onboarding Flow...");

  try {
    // Test 1: Create a user that needs onboarding (incomplete profile)
    console.log("\n📝 Test 1: Creating user with incomplete profile...");

    const testEmail = `test-onboarding-${Date.now()}@example.com`;
    const testPassword = "testpassword123";

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: "Test User", // This should trigger onboarding
        },
      },
    });

    if (signUpError) {
      console.error("❌ Sign up failed:", signUpError.message);
      return;
    }

    if (!signUpData.user) {
      console.error("❌ No user returned from sign up");
      return;
    }

    console.log("✅ User created successfully");
    console.log(`   User ID: ${signUpData.user.id}`);
    console.log(`   Email: ${signUpData.user.email}`);

    // Test 2: Check if profile exists in User table
    console.log("\n🔍 Test 2: Checking profile in User table...");

    const { data: profileData, error: profileError } = await supabase
      .from("User")
      .select("*")
      .eq("id", signUpData.user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("❌ Profile check failed:", profileError.message);
      return;
    }

    if (!profileData) {
      console.log("✅ No profile found - user needs onboarding (expected)");
    } else {
      console.log("⚠️  Profile already exists:");
      console.log(`   Name: ${profileData.name}`);
      console.log(`   Phone: ${profileData.phoneNumber || 'Not set'}`);
      console.log(`   Avatar: ${profileData.avatarUrl || 'Not set'}`);
    }

    // Test 3: Simulate profile completion
    console.log("\n✏️  Test 3: Simulating profile completion...");

    const profileInsertData = {
      id: signUpData.user.id,
      name: "John Doe",
      email: testEmail,
      phoneNumber: "+2348012345678",
      avatarUrl: null,
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from("User")
      .insert(profileInsertData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Profile creation failed:", insertError.message);
      return;
    }

    console.log("✅ Profile completed successfully");
    console.log(`   Name: ${insertedProfile.name}`);
    console.log(`   Phone: ${insertedProfile.phoneNumber}`);
    console.log(`   Email: ${insertedProfile.email}`);

    // Test 4: Verify profile completion logic
    console.log("\n🧪 Test 4: Testing profile completion logic...");

    function isProfileComplete(user: typeof insertedProfile): boolean {
      if (!user) return false;
      const hasName = user.name && user.name.trim() !== "" && user.name !== "User" && user.name !== "Qred User";
      return !!hasName;
    }

    const isComplete = isProfileComplete(insertedProfile);
    console.log(`   Profile complete: ${isComplete ? "✅ Yes" : "❌ No"}`);

    // Test 5: Test incomplete profile scenarios
    console.log("\n🧪 Test 5: Testing incomplete profile scenarios...");

    const incompleteProfiles = [
      { name: "", email: testEmail, phoneNumber: null, avatarUrl: null },
      { name: "User", email: testEmail, phoneNumber: null, avatarUrl: null },
      { name: "Qred User", email: testEmail, phoneNumber: null, avatarUrl: null },
    ];

    incompleteProfiles.forEach((profile, index) => {
      const complete = isProfileComplete(profile as any);
      console.log(`   Scenario ${index + 1} (name: "${profile.name}"): ${complete ? "❌ Complete (unexpected)" : "✅ Incomplete (expected)"}`);
    });

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete profile
    const { error: deleteProfileError } = await supabase
      .from("User")
      .delete()
      .eq("id", signUpData.user.id);

    if (deleteProfileError) {
      console.error("⚠️  Failed to delete profile:", deleteProfileError.message);
    } else {
      console.log("✅ Profile deleted");
    }

    console.log("\n🎉 Onboarding flow test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testProfileCompletionStates() {
  console.log("\n🧪 Testing Profile Completion States...");

  const testCases = [
    { name: "John Doe", expected: true, description: "Complete profile" },
    { name: "", expected: false, description: "Empty name" },
    { name: "   ", expected: false, description: "Whitespace only name" },
    { name: "User", expected: false, description: "Default 'User' name" },
    { name: "Qred User", expected: false, description: "Default 'Qred User' name" },
    { name: "A", expected: true, description: "Single character name" },
    { name: "Jane Smith", expected: true, description: "Full name" },
  ];

  function isProfileComplete(name: string): boolean {
    if (!name) return false;
    const hasName = name && name.trim() !== "" && name !== "User" && name !== "Qred User";
    return !!hasName;
  }

  testCases.forEach((testCase, index) => {
    const result = isProfileComplete(testCase.name);
    const status = result === testCase.expected ? "✅" : "❌";
    console.log(`   Test ${index + 1}: ${status} ${testCase.description} - Expected: ${testCase.expected}, Got: ${result}`);
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("🎯 Qred Onboarding Flow Test");
  console.log("=".repeat(60));

  await testOnboardingFlow();
  await testProfileCompletionStates();

  console.log("\n" + "=".repeat(60));
  console.log("✨ All tests completed!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});
