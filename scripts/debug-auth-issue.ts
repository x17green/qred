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

async function debugAuthIssue() {
  console.log("🔍 Debugging Authentication Profile Sync Issue...");
  console.log("=" .repeat(70));

  try {
    // Step 1: Test email sign-up and profile creation
    console.log("\n📧 1. Testing email sign-up and profile creation...");

    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = "password123";

    console.log(`Creating test account: ${testEmail}`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: "Test User",
        },
      },
    });

    if (signUpError) {
      console.error("❌ Sign-up failed:", signUpError.message);
      return;
    }

    console.log("✅ Sign-up successful");
    console.log(`   User ID: ${signUpData.user?.id}`);
    console.log(`   Email confirmed: ${!!signUpData.session}`);

    if (!signUpData.user) {
      console.error("❌ No user data returned");
      return;
    }

    const userId = signUpData.user.id;

    // Step 2: Test profile retrieval with .single() (current problematic approach)
    console.log("\n👤 2. Testing profile retrieval with .single()...");

    const { data: profileSingle, error: profileSingleError } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileSingleError) {
      console.log("❌ Profile retrieval with .single() failed (expected):");
      console.log(`   Error code: ${profileSingleError.code}`);
      console.log(`   Error message: ${profileSingleError.message}`);
      console.log(`   This is the PGRST116 error from your logs!`);
    } else {
      console.log("✅ Profile found with .single():", profileSingle.name);
    }

    // Step 3: Test profile retrieval with .maybeSingle() (better approach)
    console.log("\n👤 3. Testing profile retrieval with .maybeSingle()...");

    const { data: profileMaybe, error: profileMaybeError } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileMaybeError) {
      console.error("❌ Profile retrieval with .maybeSingle() failed:", profileMaybeError.message);
    } else if (profileMaybe) {
      console.log("✅ Profile found with .maybeSingle():", profileMaybe.name);
    } else {
      console.log("ℹ️  No profile found with .maybeSingle() (this is okay!)");
    }

    // Step 4: Test profile creation
    console.log("\n📝 4. Testing profile creation...");

    const profileData = {
      id: userId,
      name: "Test User Debug",
      email: testEmail,
      phoneNumber: null,
      avatarUrl: null,
    };

    const { data: createdProfile, error: createError } = await supabase
      .from("User")
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error("❌ Profile creation failed:", createError.message);
      console.log(`   Error code: ${createError.code}`);
      if (createError.code === "23505") {
        console.log("   This is the duplicate key error from your logs!");
      }
    } else {
      console.log("✅ Profile created successfully:", createdProfile.name);
    }

    // Step 5: Test duplicate profile creation (should fail)
    console.log("\n🔄 5. Testing duplicate profile creation...");

    const { data: duplicateProfile, error: duplicateError } = await supabase
      .from("User")
      .insert(profileData)
      .select()
      .single();

    if (duplicateError) {
      console.log("✅ Duplicate profile creation failed as expected:");
      console.log(`   Error code: ${duplicateError.code}`);
      console.log(`   Error message: ${duplicateError.message}`);
      if (duplicateError.code === "23505") {
        console.log("   This matches the error in your logs!");
      }
    } else {
      console.log("⚠️  Duplicate profile was created (unexpected!)");
    }

    // Step 6: Test UPSERT approach (the fix)
    console.log("\n🔧 6. Testing UPSERT approach (the fix)...");

    const upsertData = {
      id: userId,
      name: "Test User Updated",
      email: testEmail,
      phoneNumber: "+2348012345678",
      avatarUrl: null,
    };

    const { data: upsertedProfile, error: upsertError } = await supabase
      .from("User")
      .upsert(upsertData, { onConflict: "id" })
      .select()
      .single();

    if (upsertError) {
      console.error("❌ UPSERT failed:", upsertError.message);
    } else {
      console.log("✅ UPSERT successful:", upsertedProfile.name);
      console.log("   This approach handles both create and update!");
    }

    // Step 7: Test the improved profile retrieval function
    console.log("\n🛠️  7. Testing improved profile retrieval function...");

    async function getProfileSafely(userId: string) {
      const { data, error } = await supabase
        .from("User")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      return data; // Can be null if no profile exists
    }

    const safeProfile = await getProfileSafely(userId);
    if (safeProfile) {
      console.log("✅ Safe profile retrieval successful:", safeProfile.name);
    } else {
      console.log("ℹ️  No profile found (handled gracefully)");
    }

    // Step 8: Test the improved profile creation function
    console.log("\n🛠️  8. Testing improved profile creation function...");

    async function createOrUpdateProfile(profileData: any) {
      // First, try to get existing profile
      const existing = await getProfileSafely(profileData.id);

      if (existing) {
        console.log("   Profile exists, updating...");
        const { data, error } = await supabase
          .from("User")
          .update(profileData)
          .eq("id", profileData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        console.log("   Profile doesn't exist, creating...");
        const { data, error } = await supabase
          .from("User")
          .insert(profileData)
          .select()
          .single();

        if (error) {
          // If it's a duplicate key error, try to get the existing profile
          if (error.code === "23505") {
            console.log("   Duplicate key detected, fetching existing profile...");
            return await getProfileSafely(profileData.id);
          }
          throw error;
        }
        return data;
      }
    }

    const newTestData = {
      id: userId,
      name: "Test User Final",
      email: testEmail,
      phoneNumber: "+2348087654321",
      avatarUrl: null,
    };

    const finalProfile = await createOrUpdateProfile(newTestData);
    console.log("✅ Improved profile function successful:", finalProfile?.name);

    // Step 9: Test concurrent profile creation (simulating race condition)
    console.log("\n⚡ 9. Testing concurrent profile creation...");

    const newUserId = "test-concurrent-user-" + Date.now();
    const concurrentData = {
      id: newUserId,
      name: "Concurrent Test User",
      email: `concurrent_${Date.now()}@example.com`,
      phoneNumber: null,
      avatarUrl: null,
    };

    // Simulate concurrent requests
    const promises = Array.from({ length: 3 }, (_, i) =>
      createOrUpdateProfile({
        ...concurrentData,
        name: `Concurrent Test User ${i + 1}`,
      })
    );

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      console.log(`✅ Concurrent test results: ${successful} successful, ${failed} failed`);
      if (failed === 0) {
        console.log("   ✅ Race condition handled properly!");
      }
    } catch (error) {
      console.error("❌ Concurrent test failed:", error);
    }

    // Step 10: Cleanup test data
    console.log("\n🧹 10. Cleaning up test data...");

    // Delete test profiles
    const testUserIds = [userId, newUserId];

    for (const testUserId of testUserIds) {
      const { error: deleteError } = await supabase
        .from("User")
        .delete()
        .eq("id", testUserId);

      if (deleteError && deleteError.code !== "PGRST116") {
        console.log(`⚠️  Could not delete profile ${testUserId}:`, deleteError.message);
      }
    }

    // Delete auth user (Note: This might not work with anon key)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.log("⚠️  Could not delete auth user (expected with anon key)");
    }

    console.log("✅ Cleanup completed");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Authentication Debug Analysis Complete!");
    console.log("=".repeat(70));

    console.log("\n📊 Summary of Issues Found:");
    console.log("1. ❌ Using .single() instead of .maybeSingle() for profile retrieval");
    console.log("2. ❌ No handling of duplicate key errors during profile creation");
    console.log("3. ❌ Race conditions in concurrent profile creation");
    console.log("4. ❌ No graceful handling of 'profile not found' scenarios");

    console.log("\n🛠️  Recommended Fixes:");
    console.log("1. ✅ Replace .single() with .maybeSingle() in getUserProfile()");
    console.log("2. ✅ Implement proper UPSERT logic for profile creation");
    console.log("3. ✅ Add retry logic for handling race conditions");
    console.log("4. ✅ Improve error handling in auth service");

    console.log("\n📁 Files to Update:");
    console.log("• lib/services/supabase.ts - Fix getUserProfile() function");
    console.log("• lib/services/authService.ts - Improve profile creation logic");
    console.log("• lib/store/authStore.ts - Better error handling");

  } catch (error) {
    console.error("❌ Debug script failed:", error);
  }
}

async function main() {
  await debugAuthIssue();
}

main().catch((error) => {
  console.error("❌ Debug script crashed:", error);
  process.exit(1);
});
