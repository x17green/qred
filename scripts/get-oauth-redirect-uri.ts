// Script to get the actual OAuth redirect URI using Expo's Linking API
// This will show you the exact URI that your app will use for Google OAuth
require("dotenv").config();

// We need to simulate the React Native environment for Linking to work
// This approach uses expo-linking which can work in Node.js context
const { URL } = require("url");

console.log("🔗 OAuth Redirect URI Generator");
console.log("=".repeat(50));

// Read app configuration
let appSlug = "qred";
let bundleId = "com.x17green.qred";
let packageName = "com.x17green.qred";
let expoUsername = "x17green";

try {
  const appJson = require("../app.json");
  appSlug = appJson.expo?.slug || "qred";
  bundleId = appJson.expo?.ios?.bundleIdentifier || "com.x17green.qred";
  packageName = appJson.expo?.android?.package || "com.x17green.qred";
} catch (error) {
  console.log("⚠️ Using default values - could not read app.json");
}

// Simulate Linking.createURL() behavior
function createURL(
  path = "",
  options: { scheme?: string; queryParams?: Record<string, string> } = {},
) {
  const { scheme = appSlug, queryParams = {} } = options;

  // In development (Expo Go), Expo creates proxy URLs
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    // Expo development URL format
    return `https://auth.expo.io/@${expoUsername}/${appSlug}${path ? `/${path}` : ""}`;
  } else {
    // Production/standalone app URL format
    const queryString =
      Object.keys(queryParams).length > 0
        ? "?" + new URLSearchParams(queryParams).toString()
        : "";
    return `${scheme}://${path}${queryString}`;
  }
}

// Generate redirect URIs for different scenarios
console.log("\n📱 Development Environment (Expo Go):");
const devRedirectUri = createURL("auth/google");
console.log(`  Redirect URI: ${devRedirectUri}`);

console.log("\n🚀 Production Environment (Standalone App):");
process.env.NODE_ENV = "production";
const prodRedirectUri = createURL("auth/google");
console.log(`  Redirect URI: ${prodRedirectUri}`);

// Reset environment
delete (process.env as any).NODE_ENV;

console.log("\n📦 Alternative Native URIs:");
const nativeUri1 = `${bundleId}://auth/google`;
const nativeUri2 = `${appSlug}://auth/google`;
console.log(`  Bundle ID URI: ${nativeUri1}`);
console.log(`  App Scheme URI: ${nativeUri2}`);

console.log("\n🔧 Google Console Setup:");
console.log(
  "Add these URIs to your Google OAuth Client 'Authorized redirect URIs':",
);
console.log(`  ✅ ${devRedirectUri}`);
console.log(`  ✅ ${prodRedirectUri}`);
console.log(`  ✅ ${nativeUri1}`);

console.log("\n📋 Current Configuration:");
console.log(`  Expo Username: ${expoUsername}`);
console.log(`  App Slug: ${appSlug}`);
console.log(`  Bundle ID: ${bundleId}`);
console.log(`  Package Name: ${packageName}`);

console.log("\n🌐 Environment Variables:");
console.log(
  `  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: ${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "SET" : "NOT SET"}`,
);

console.log("\n💡 Usage in Your App:");
console.log("Import { Linking } from 'expo-linking';");
console.log("const redirectUri = Linking.createURL('auth/google');");
console.log("console.log('Redirect URI:', redirectUri);");

console.log("\n⚠️ Important Notes:");
console.log("• Development URIs include your Expo username (@x17green)");
console.log("• Production URIs use your app's custom scheme");
console.log("• Make sure all URIs are added to Google Console");
console.log("• Test in both development and production environments");

// Show what the actual makeRedirectUri would generate
console.log("\n🔄 What makeRedirectUri() generates:");
console.log(
  "Development:",
  `https://auth.expo.io/@${expoUsername}/${appSlug}/--/auth/google`,
);
console.log("Production:", `${appSlug}://auth/google`);

console.log("\n✅ Next Steps:");
console.log("1. Copy the URIs above to Google Cloud Console");
console.log("2. Test OAuth in development first");
console.log("3. Build and test in production/TestFlight");
console.log("4. Monitor console logs for any redirect URI mismatches");
