// Debug script to show what redirect URIs you need for Google OAuth
require("dotenv").config();

console.log("🔍 Google OAuth Redirect URI Debug");
console.log("=".repeat(50));

// Read app configuration
let appSlug = "qred";
let bundleId = "com.x17green.qred";
let packageName = "com.x17green.qred";

try {
  const appJson = require("../app.json");
  appSlug = appJson.expo?.slug || "qred";
  bundleId = appJson.expo?.ios?.bundleIdentifier || "com.x17green.qred";
  packageName = appJson.expo?.android?.package || "com.x17green.qred";
} catch (error) {
  console.log("⚠️ Using default values - could not read app.json");
}

// Generate expected redirect URIs
const devRedirectUri = `https://auth.expo.io/@x17green/${appSlug}/auth/google`;
const prodRedirectUri = `${appSlug}://auth/google`;
const nativeRedirectUri = `${bundleId}://auth/google`;

console.log("\n📱 Development Environment (Expo Go):");
console.log(`  Redirect URI: ${devRedirectUri}`);
console.log(`  ✅ Add this to Google Console for Expo Go development`);

console.log("\n🚀 Production Environment (Standalone App):");
console.log(`  Redirect URI: ${prodRedirectUri}`);
console.log(`  ✅ Add this to Google Console for production builds`);

console.log("\n📦 Native Build Alternative:");
console.log(`  Redirect URI: ${nativeRedirectUri}`);
console.log(`  ✅ Add this to Google Console for development builds`);

console.log("\n🔧 Google Console Setup Instructions:");
console.log("1. Go to: https://console.developers.google.com/");
console.log("2. Navigate to: Credentials > OAuth 2.0 Client IDs");
console.log("3. Edit your Web Client ID");
console.log("4. Add these URIs to 'Authorized redirect URIs':");
console.log(`   - ${devRedirectUri}`);
console.log(`   - ${prodRedirectUri}`);
console.log(`   - ${nativeRedirectUri}`);

console.log("\n🌐 Expected URIs Format:");
console.log("• Development: https://auth.expo.io/@x17green/qred/auth/google");
console.log("• Production: qred://auth/google");
console.log("• Native: com.x17green.qred://auth/google");

console.log("\n💡 Current Environment Variables:");
console.log(
  `  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: ${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "SET" : "NOT SET"}`,
);
console.log(
  `  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: ${process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? "SET" : "NOT SET"}`,
);
console.log(
  `  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: ${process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? "SET" : "NOT SET"}`,
);

console.log("\n⚠️  Troubleshooting:");
console.log("• Make sure you're using the Web Client ID, not Android/iOS");
console.log("• Expo proxy URLs change based on your Expo username");
console.log("• In development, always use useProxy: true");
console.log("• For production builds, use useProxy: false");

// Show current app configuration
console.log("\n📋 Current App Configuration:");
try {
  const appJson = require("../app.json");
  console.log(`  App Slug: ${appJson.expo?.slug || "NOT SET"}`);
  console.log(
    `  Bundle ID: ${appJson.expo?.ios?.bundleIdentifier || "NOT SET"}`,
  );
  console.log(`  Package: ${appJson.expo?.android?.package || "NOT SET"}`);
} catch (error) {
  console.log("  ⚠️ Could not read app.json");
}
