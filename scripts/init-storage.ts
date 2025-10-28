import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeStorage() {
  console.log("🚀 Initializing Supabase Storage...");

  try {
    // Check if avatars bucket exists
    console.log("📋 Checking existing buckets...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Failed to list buckets:", listError.message);
      return;
    }

    console.log(`📦 Found ${buckets?.length || 0} existing buckets`);

    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');

    if (avatarBucketExists) {
      console.log("✅ Avatars bucket already exists");
    } else {
      console.log("📤 Creating avatars bucket...");

      const { data: bucket, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createError) {
        console.error("❌ Failed to create avatars bucket:", createError.message);
        return;
      }

      console.log("✅ Avatars bucket created successfully");
    }

    // Test bucket access
    console.log("🧪 Testing bucket access...");

    const { data: files, error: listFilesError } = await supabase.storage
      .from('avatars')
      .list('', {
        limit: 1,
      });

    if (listFilesError) {
      console.error("❌ Failed to access avatars bucket:", listFilesError.message);
      return;
    }

    console.log("✅ Avatars bucket is accessible");
    console.log(`📁 Found ${files?.length || 0} files in avatars bucket`);

    // Display bucket configuration
    const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
    if (avatarBucket) {
      console.log("\n📊 Bucket Configuration:");
      console.log(`   Name: ${avatarBucket.name}`);
      console.log(`   Public: ${avatarBucket.public}`);
      console.log(`   File Size Limit: ${avatarBucket.file_size_limit ? (avatarBucket.file_size_limit / 1024 / 1024) + 'MB' : 'No limit'}`);
      console.log(`   Allowed MIME Types: ${avatarBucket.allowed_mime_types?.join(', ') || 'All types'}`);
      console.log(`   Created: ${avatarBucket.created_at}`);
    }

    console.log("\n🎉 Storage initialization completed successfully!");

  } catch (error) {
    console.error("❌ Storage initialization failed:", error);
  }
}

async function testStorageOperations() {
  console.log("\n🧪 Testing storage operations...");

  try {
    // Test creating a test file
    const testContent = "test-content";
    const testPath = "test/test-file.txt";

    console.log("📤 Testing file upload...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ File upload test failed:", uploadError.message);
      return;
    }

    console.log("✅ File upload successful");

    // Test getting public URL
    console.log("🔗 Testing public URL generation...");
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(testPath);

    if (!urlData?.publicUrl) {
      console.error("❌ Failed to get public URL");
      return;
    }

    console.log("✅ Public URL generated:", urlData.publicUrl);

    // Clean up test file
    console.log("🧹 Cleaning up test file...");
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([testPath]);

    if (deleteError) {
      console.error("⚠️  Failed to clean up test file:", deleteError.message);
    } else {
      console.log("✅ Test file cleaned up");
    }

    console.log("\n✅ All storage operations tested successfully!");

  } catch (error) {
    console.error("❌ Storage operations test failed:", error);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🎯 Qred Storage Initialization Script");
  console.log("=".repeat(60));

  await initializeStorage();
  await testStorageOperations();

  console.log("\n" + "=".repeat(60));
  console.log("✨ Initialization complete! You can now use avatar uploads.");
  console.log("=".repeat(60));
}

// Run the initialization
main().catch((error) => {
  console.error("❌ Initialization script failed:", error);
  process.exit(1);
});
