// Load environment variables from .env file
require("dotenv").config({
  quiet: true
});

const requiredVars = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"];

console.log("🔍 Checking environment variables...");
console.log("Current working directory:", process.cwd());

// Debug: Show what variables are loaded
console.log("\n📋 Environment variables found:");
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(
      `  ✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`,
    );
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  console.error(
    "\n💡 Make sure your .env file exists and contains the required variables.",
  );
  process.exit(1);
}

console.log("\n✅ All required environment variables are set");
process.exit(0);
