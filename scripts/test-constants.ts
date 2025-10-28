// Test script to verify constants are reading environment variables correctly
require("dotenv").config();

import { API_CONFIG, PAYMENT_CONFIG } from "../lib/constants";

console.log("🧪 Testing Constants Environment Variable Loading");
console.log("=" .repeat(50));

// Test API Configuration
console.log("\n📡 API Configuration:");
console.log(`BASE_URL: ${API_CONFIG.BASE_URL}`);
console.log(`Expected: ${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1"}`);
console.log(`Match: ${API_CONFIG.BASE_URL === (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1") ? "✅" : "❌"}`);

// Test Payment Configuration
console.log("\n💳 Payment Configuration:");
console.log(`Paystack Test Key: ${PAYMENT_CONFIG.PAYSTACK.TEST_PUBLIC_KEY || "NOT SET"}`);
console.log(`Paystack Live Key: ${PAYMENT_CONFIG.PAYSTACK.LIVE_PUBLIC_KEY || "NOT SET"}`);
console.log(`Flutterwave Test Key: ${PAYMENT_CONFIG.FLUTTERWAVE.TEST_PUBLIC_KEY || "NOT SET"}`);
console.log(`Flutterwave Live Key: ${PAYMENT_CONFIG.FLUTTERWAVE.LIVE_PUBLIC_KEY || "NOT SET"}`);

// Test Raw Environment Variables
console.log("\n🔍 Raw Environment Variables:");
console.log(`EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || "NOT SET"}`);
console.log(`EXPO_PUBLIC_PAYSTACK_TEST_KEY: ${process.env.EXPO_PUBLIC_PAYSTACK_TEST_KEY || "NOT SET"}`);
console.log(`EXPO_PUBLIC_PAYSTACK_LIVE_KEY: ${process.env.EXPO_PUBLIC_PAYSTACK_LIVE_KEY || "NOT SET"}`);
console.log(`EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY: ${process.env.EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY || "NOT SET"}`);
console.log(`EXPO_PUBLIC_FLUTTERWAVE_LIVE_KEY: ${process.env.EXPO_PUBLIC_FLUTTERWAVE_LIVE_KEY || "NOT SET"}`);

// Summary
console.log("\n📋 Summary:");
const apiMatch = API_CONFIG.BASE_URL === (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1");
const paystackTestMatch = PAYMENT_CONFIG.PAYSTACK.TEST_PUBLIC_KEY === (process.env.EXPO_PUBLIC_PAYSTACK_TEST_KEY || "");
const paystackLiveMatch = PAYMENT_CONFIG.PAYSTACK.LIVE_PUBLIC_KEY === (process.env.EXPO_PUBLIC_PAYSTACK_LIVE_KEY || "");
const flutterwaveTestMatch = PAYMENT_CONFIG.FLUTTERWAVE.TEST_PUBLIC_KEY === (process.env.EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY || "");
const flutterwaveLiveMatch = PAYMENT_CONFIG.FLUTTERWAVE.LIVE_PUBLIC_KEY === (process.env.EXPO_PUBLIC_FLUTTERWAVE_LIVE_KEY || "");

if (apiMatch && paystackTestMatch && paystackLiveMatch && flutterwaveTestMatch && flutterwaveLiveMatch) {
  console.log("✅ All constants are correctly reading environment variables");
} else {
  console.log("❌ Some constants are not reading environment variables correctly");
  console.log(`  - API Config: ${apiMatch ? "✅" : "❌"}`);
  console.log(`  - Paystack Test: ${paystackTestMatch ? "✅" : "❌"}`);
  console.log(`  - Paystack Live: ${paystackLiveMatch ? "✅" : "❌"}`);
  console.log(`  - Flutterwave Test: ${flutterwaveTestMatch ? "✅" : "❌"}`);
  console.log(`  - Flutterwave Live: ${flutterwaveLiveMatch ? "✅" : "❌"}`);
}

console.log("\n💡 Note: In React Native/Expo, environment variables are loaded automatically by Metro bundler");
console.log("This test uses dotenv to simulate the same environment loading for Node.js");
