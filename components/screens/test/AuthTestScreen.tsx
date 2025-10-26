import React, { useState, useEffect } from "react";
import { Alert, ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";
import { authService } from "@/lib/services/authService";
import { debtService } from "@/lib/services/debtService";
import { supabase } from "@/lib/services/supabase";
import { API_CONFIG, PAYMENT_CONFIG } from "@/lib/constants";

interface AuthTestScreenProps {
  navigation?: any;
}

export default function AuthTestScreen({ navigation }: AuthTestScreenProps) {
  const { user, authUser, isAuthenticated, isLoading, error } = useAuth();
  const { sendOTP, signIn } = useAuthActions();
  const {
    signInWithGoogle,
    isLoading: isGoogleLoading,
    error: googleError,
  } = useGoogleAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  // Test Supabase Connection
  const testSupabaseConnection = async () => {
    try {
      addTestResult("🔍 Testing Supabase connection...");

      const { data, error } = await supabase
        .from("User")
        .select("count", { count: "exact" });

      if (error) {
        addTestResult(`❌ Supabase connection failed: ${error.message}`);
      } else {
        addTestResult(`✅ Supabase connected! User count: ${data.length}`);
      }
    } catch (err: any) {
      addTestResult(`❌ Supabase connection error: ${err.message}`);
    }
  };

  // Test Phone OTP
  const testPhoneOTP = async () => {
    try {
      addTestResult(`📱 Testing OTP for ${phoneNumber}...`);
      await sendOTP(phoneNumber);
      addTestResult("✅ OTP sent successfully!");
    } catch (err: any) {
      addTestResult(`❌ OTP failed: ${err.message}`);
    }
  };

  // Test OTP Verification
  const testOTPVerification = async () => {
    try {
      addTestResult(`🔐 Testing OTP verification...`);
      await signIn(phoneNumber, otp, {
        email: "test@qred.com",
        name: "Test User",
      });
      addTestResult("✅ OTP verification successful!");
    } catch (err: any) {
      addTestResult(`❌ OTP verification failed: ${err.message}`);
    }
  };

  // Test Google OAuth
  const testGoogleOAuth = async () => {
    try {
      addTestResult("🔍 Testing Google OAuth...");
      await signInWithGoogle();
      addTestResult("✅ Google OAuth initiated!");
    } catch (err: any) {
      addTestResult(`❌ Google OAuth failed: ${err.message}`);
    }
  };

  // Test Database Operations
  const testDatabaseOperations = async () => {
    try {
      addTestResult("🗃️ Testing database operations...");

      // Test getting debts (should work even if empty)
      const lendingDebts = await debtService.getLendingDebts();
      addTestResult(`✅ Lending debts query: ${lendingDebts.length} results`);

      const owingDebts = await debtService.getOwingDebts();
      addTestResult(`✅ Owing debts query: ${owingDebts.length} results`);

      // Test debt summary
      const summary = await debtService.getDebtSummary();
      addTestResult(
        `✅ Debt summary: ${summary.total_lending} lending, ${summary.total_owing} owing`,
      );
    } catch (err: any) {
      addTestResult(`❌ Database operations failed: ${err.message}`);
    }
  };

  // Test Authentication Status
  const testAuthStatus = async () => {
    try {
      addTestResult("👤 Testing auth status...");

      const isAuth = await authService.isAuthenticated();
      addTestResult(
        `Auth status: ${isAuth ? "✅ Authenticated" : "❌ Not authenticated"}`,
      );

      const currentUser = await authService.getCurrentUser();
      addTestResult(
        `Current user: ${currentUser ? "✅ " + currentUser.id : "❌ No user"}`,
      );

      const token = await authService.getAuthToken();
      addTestResult(`Auth token: ${token ? "✅ Present" : "❌ Missing"}`);
    } catch (err: any) {
      addTestResult(`❌ Auth status test failed: ${err.message}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      addTestResult("🚀 Starting Qred Supabase Authentication Tests...");

      await testSupabaseConnection();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await testAuthStatus();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isAuthenticated) {
        await testDatabaseOperations();
      } else {
        addTestResult("⚠️ Skipping database tests - not authenticated");
      }

      addTestResult("🎉 All tests completed!");
    } catch (err: any) {
      addTestResult(`❌ Test suite failed: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      addTestResult("👋 Signed out successfully");
    } catch (err: any) {
      addTestResult(`❌ Sign out failed: ${err.message}`);
    }
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView className="flex-1 px-4 py-6">
        <VStack space="lg">
          {/* Header */}
          <VStack space="sm">
            <Text size="2xl" className="font-bold text-typography-900">
              Qred Auth Test Suite
            </Text>
            <Text size="sm" className="text-typography-500">
              Test Supabase authentication and database integration
            </Text>
          </VStack>

          {/* Auth Status */}
          <Box className="bg-background-50 p-4 rounded-lg border border-background-200">
            <VStack space="sm">
              <Text size="lg" className="font-semibold text-typography-900">
                Authentication Status
              </Text>
              <HStack space="md" className="items-center">
                <Text size="sm" className="text-typography-600">
                  Status:
                </Text>
                <Text
                  size="sm"
                  className={`font-medium ${isAuthenticated ? "text-success-600" : "text-error-600"}`}
                >
                  {isAuthenticated
                    ? "✅ Authenticated"
                    : "❌ Not Authenticated"}
                </Text>
              </HStack>
              {user && (
                <VStack space="xs">
                  <Text size="xs" className="text-typography-500">
                    User ID: {authUser?.id || "N/A"}
                  </Text>
                  <Text size="xs" className="text-typography-500">
                    Profile: {user.name} ({user.email || "No email"})
                  </Text>
                  <Text size="xs" className="text-typography-500">
                    Phone: {user.phoneNumber || "No phone"}
                  </Text>
                </VStack>
              )}
              {error && (
                <Text size="sm" className="text-error-600">
                  Error: {error}
                </Text>
              )}
            </VStack>
          </Box>

          {/* Manual Tests */}
          <VStack space="md">
            <Text size="lg" className="font-semibold text-typography-900">
              Manual Tests
            </Text>

            {/* Phone OTP Test */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-800">
                Phone OTP Test
              </Text>
              <Input variant="outline" size="md">
                <InputField
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </Input>
              <HStack space="sm">
                <Button size="sm" onPress={testPhoneOTP} isDisabled={isLoading}>
                  <ButtonText>Send OTP</ButtonText>
                </Button>
              </HStack>
            </VStack>

            {/* OTP Verification Test */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-800">
                OTP Verification Test
              </Text>
              <Input variant="outline" size="md">
                <InputField
                  placeholder="OTP Code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
              </Input>
              <Button
                size="sm"
                onPress={testOTPVerification}
                isDisabled={isLoading}
              >
                <ButtonText>Verify OTP</ButtonText>
              </Button>
            </VStack>

            {/* Google OAuth Test */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-800">
                Google OAuth Test
              </Text>
              <Button
                size="sm"
                onPress={testGoogleOAuth}
                isDisabled={isGoogleLoading}
              >
                <ButtonText>
                  {isGoogleLoading ? "Signing in..." : "Test Google Sign-In"}
                </ButtonText>
              </Button>
              {googleError && (
                <Text size="sm" className="text-error-600">
                  Google Error: {googleError}
                </Text>
              )}
            </VStack>
          </VStack>

          {/* Test Controls */}
          <HStack space="md">
            <Button
              size="md"
              className="flex-1 bg-primary-600"
              onPress={runAllTests}
              isDisabled={isRunningTests}
            >
              <ButtonText>
                {isRunningTests ? "Running Tests..." : "Run All Tests"}
              </ButtonText>
            </Button>
            <Button size="md" variant="outline" onPress={clearResults}>
              <ButtonText>Clear</ButtonText>
            </Button>
          </HStack>

          {/* Auth Actions */}
          {isAuthenticated && (
            <HStack space="md">
              <Button
                size="md"
                variant="outline"
                className="flex-1 border-error-300"
                onPress={handleSignOut}
              >
                <ButtonText className="text-error-600">Sign Out</ButtonText>
              </Button>
            </HStack>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <VStack space="sm">
              <Text size="lg" className="font-semibold text-typography-900">
                Test Results
              </Text>
              <Box className="bg-background-900 p-3 rounded-lg">
                <ScrollView style={{ maxHeight: 300 }}>
                  {testResults.map((result, index) => (
                    <Text
                      key={index}
                      size="xs"
                      className="text-background-100 font-mono mb-1"
                    >
                      {result}
                    </Text>
                  ))}
                </ScrollView>
              </Box>
            </VStack>
          )}

          {/* Environment Info */}
          <VStack space="sm">
            <Text size="md" className="font-semibold text-typography-900">
              Environment
            </Text>
            <Box className="bg-background-50 p-3 rounded-lg">
              <VStack space="xs">
                <Text
                  size="sm"
                  className="font-medium text-typography-800 mb-2"
                >
                  Environment Variables Debug
                </Text>
                <Text size="xs" className="text-typography-600">
                  API URL (from .env):{" "}
                  {process.env.EXPO_PUBLIC_API_URL || "NOT SET"}
                </Text>
                <Text size="xs" className="text-typography-600">
                  API Config BASE_URL: {API_CONFIG.BASE_URL}
                </Text>
                <Text size="xs" className="text-typography-600">
                  Match:{" "}
                  {API_CONFIG.BASE_URL ===
                  (process.env.EXPO_PUBLIC_API_URL ||
                    "http://localhost:3000/api/v1")
                    ? "✅"
                    : "❌"}
                </Text>
                <Text size="xs" className="text-typography-600">
                  Supabase URL:{" "}
                  {process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
                </Text>
                <Text size="xs" className="text-typography-600">
                  Supabase Key:{" "}
                  {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
                    ? "✅ Set"
                    : "❌ Missing"}
                </Text>
                <Text size="xs" className="text-typography-600">
                  Google Web Client:{" "}
                  {process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
                    ? "✅ Set"
                    : "❌ Missing"}
                </Text>
                <Text size="xs" className="text-typography-600">
                  Paystack Test Key:{" "}
                  {PAYMENT_CONFIG.PAYSTACK.TEST_PUBLIC_KEY || "NOT SET"}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
