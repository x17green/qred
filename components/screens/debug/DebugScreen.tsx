import React from "react";
import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { API_CONFIG, PAYMENT_CONFIG } from "@/lib/constants";
import * as Linking from "expo-linking";

interface DebugScreenProps {
  navigation?: any;
}

export default function DebugScreen({ navigation }: DebugScreenProps) {
  // Generate OAuth redirect URI dynamically
  const oauthRedirectUri = Linking.createURL("auth/google");

  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="p-4">
        <VStack space="lg">
          {/* Header */}
          <Text
            size="2xl"
            className="font-bold text-center text-typography-900"
          >
            🧪 Debug Environment Variables
          </Text>

          {/* Navigation */}
          <HStack space="md" className="justify-center">
            <Button
              size="sm"
              variant="outline"
              onPress={() => navigation?.navigate?.("Login")}
            >
              <ButtonText>Go to Login</ButtonText>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => navigation?.navigate?.("Test")}
            >
              <ButtonText>Go to Test</ButtonText>
            </Button>
          </HStack>

          {/* API Configuration */}
          <Box className="bg-success-50 p-4 rounded-lg border border-success-200">
            <Text size="lg" className="font-semibold text-success-800 mb-3">
              📡 API Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-success-700">
                <Text className="font-semibold">BASE_URL:</Text>{" "}
                {API_CONFIG.BASE_URL}
              </Text>
              <Text size="sm" className="text-success-700">
                <Text className="font-semibold">From .env:</Text>{" "}
                {process.env.EXPO_PUBLIC_API_URL || "NOT SET"}
              </Text>
              <Text size="sm" className="text-success-700">
                <Text className="font-semibold">Match:</Text>{" "}
                {API_CONFIG.BASE_URL ===
                (process.env.EXPO_PUBLIC_API_URL ||
                  "http://localhost:3000/api/v1")
                  ? "✅ YES"
                  : "❌ NO"}
              </Text>
            </VStack>
          </Box>

          {/* Supabase Configuration */}
          <Box className="bg-primary-50 p-4 rounded-lg border border-primary-200">
            <Text size="lg" className="font-semibold text-primary-800 mb-3">
              🗄️ Supabase Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-primary-700">
                <Text className="font-semibold">URL:</Text>{" "}
                {process.env.EXPO_PUBLIC_SUPABASE_URL
                  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
                  : "NOT SET"}
              </Text>
              <Text size="sm" className="text-primary-700">
                <Text className="font-semibold">Key:</Text>{" "}
                {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
                  ? `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
                  : "NOT SET"}
              </Text>
            </VStack>
          </Box>

          {/* Google OAuth Configuration */}
          <Box className="bg-warning-50 p-4 rounded-lg border border-warning-200">
            <Text size="lg" className="font-semibold text-warning-800 mb-3">
              🔐 Google OAuth Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-warning-700">
                <Text className="font-semibold">Web Client:</Text>{" "}
                {process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
                  ? `${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.substring(0, 20)}...`
                  : "NOT SET"}
              </Text>
              <Text size="sm" className="text-warning-700">
                <Text className="font-semibold">iOS Client:</Text>{" "}
                {process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "NOT SET"}
              </Text>
              <Text size="sm" className="text-warning-700">
                <Text className="font-semibold">Android Client:</Text>{" "}
                {process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
                  ? `${process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.substring(0, 20)}...`
                  : "NOT SET"}
              </Text>
            </VStack>
          </Box>

          {/* OAuth Configuration */}
          <Box className="bg-info-50 p-4 rounded-lg border border-info-200">
            <Text size="lg" className="font-semibold text-info-800 mb-3">
              🔗 OAuth Redirect URI (Dynamic)
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-info-700">
                <Text className="font-semibold">Current URI:</Text>{" "}
                {oauthRedirectUri}
              </Text>
              <Text size="sm" className="text-info-700">
                <Text className="font-semibold">Type:</Text>{" "}
                {oauthRedirectUri.includes("auth.expo.io")
                  ? "Development (Expo Go)"
                  : "Production/Native"}
              </Text>
              <Text size="sm" className="text-info-700">
                <Text className="font-semibold">Add to Google Console:</Text> ✅
                Copy above URI
              </Text>
            </VStack>
          </Box>

          {/* Payment Configuration */}
          <Box className="bg-error-50 p-4 rounded-lg border border-error-200">
            <Text size="lg" className="font-semibold text-error-800 mb-3">
              💳 Payment Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-error-700">
                <Text className="font-semibold">Paystack Test:</Text>{" "}
                {PAYMENT_CONFIG.PAYSTACK.TEST_PUBLIC_KEY || "NOT SET"}
              </Text>
              <Text size="sm" className="text-error-700">
                <Text className="font-semibold">Paystack Live:</Text>{" "}
                {PAYMENT_CONFIG.PAYSTACK.LIVE_PUBLIC_KEY || "NOT SET"}
              </Text>
              <Text size="sm" className="text-error-700">
                <Text className="font-semibold">Flutterwave Test:</Text>{" "}
                {PAYMENT_CONFIG.FLUTTERWAVE.TEST_PUBLIC_KEY || "NOT SET"}
              </Text>
              <Text size="sm" className="text-error-700">
                <Text className="font-semibold">Flutterwave Live:</Text>{" "}
                {PAYMENT_CONFIG.FLUTTERWAVE.LIVE_PUBLIC_KEY || "NOT SET"}
              </Text>
            </VStack>
          </Box>

          {/* App Environment */}
          <Box className="bg-background-100 p-4 rounded-lg border border-background-300">
            <Text size="lg" className="font-semibold text-typography-800 mb-3">
              ⚙️ App Environment
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-typography-600">
                <Text className="font-semibold">App Name:</Text>{" "}
                {process.env.EXPO_PUBLIC_APP_NAME || "NOT SET"}
              </Text>
              <Text size="sm" className="text-typography-600">
                <Text className="font-semibold">App Version:</Text>{" "}
                {process.env.EXPO_PUBLIC_APP_VERSION || "NOT SET"}
              </Text>
              <Text size="sm" className="text-typography-600">
                <Text className="font-semibold">Environment:</Text>{" "}
                {process.env.EXPO_PUBLIC_APP_ENV || "NOT SET"}
              </Text>
              <Text size="sm" className="text-typography-600">
                <Text className="font-semibold">Dev Mode:</Text>{" "}
                {process.env.EXPO_PUBLIC_DEV_MODE || "NOT SET"}
              </Text>
            </VStack>
          </Box>

          {/* Summary */}
          <Box className="bg-background-50 p-4 rounded-lg">
            <Text size="lg" className="font-semibold text-typography-800 mb-3">
              📊 Summary
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-typography-600">
                {process.env.EXPO_PUBLIC_SUPABASE_URL &&
                process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
                  ? "✅ Supabase configuration looks good"
                  : "❌ Supabase configuration incomplete"}
              </Text>
              <Text size="sm" className="text-typography-600">
                {process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
                  ? "✅ Google OAuth configured"
                  : "⚠️ Google OAuth not configured"}
              </Text>
              <Text size="sm" className="text-typography-600">
                {API_CONFIG.BASE_URL === process.env.EXPO_PUBLIC_API_URL
                  ? "✅ API config matches environment"
                  : "⚠️ API config using fallback value"}
              </Text>
              <Text size="sm" className="text-typography-600">
                {oauthRedirectUri
                  ? "✅ OAuth redirect URI generated successfully"
                  : "❌ OAuth redirect URI generation failed"}
              </Text>
            </VStack>
          </Box>

          {/* Instructions */}
          <Box className="bg-info-50 p-4 rounded-lg border border-info-200">
            <Text size="lg" className="font-semibold text-info-800 mb-3">
              💡 What This Shows
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-info-700">
                • All EXPO_PUBLIC_* variables should be loaded from your .env
                file
              </Text>
              <Text size="sm" className="text-info-700">
                • If something shows "NOT SET", check your .env file
              </Text>
              <Text size="sm" className="text-info-700">
                • Constants should match the raw environment variables
              </Text>
              <Text size="sm" className="text-info-700">
                • This proves environment loading works in React Native
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
}
