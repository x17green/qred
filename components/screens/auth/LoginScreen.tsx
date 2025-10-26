import React, { useState } from "react";
import { Alert } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useAuthActions } from "@/lib/store/authStore";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";
import { REGEX_PATTERNS } from "@/constants";
import { authService } from "@/lib/services/authService";

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { sendOTP, signInWithEmail } = useAuthActions();
  const {
    signInWithGoogle,
    isLoading: isGoogleLoading,
    error: googleError,
    clearError,
  } = useGoogleAuth();

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) {
      setErrors({ phone: "Phone number is required" });
      return false;
    }

    if (!authService.validatePhoneNumber(phone)) {
      setErrors({ phone: "Please enter a valid Nigerian phone number" });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    try {
      setIsLoading(true);
      const formattedPhone = authService.formatPhoneNumber(phoneNumber);

      await sendOTP(formattedPhone);

      // Navigate to OTP screen
      navigation.navigate("OTP", {
        phoneNumber: formattedPhone,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError(); // Clear any previous Google auth errors
      await signInWithGoogle();

      // If successful and no OTP required, navigation will be handled by auth state change
      // If OTP required, the useGoogleAuth hook will set appropriate error state
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Google sign in failed",
      );
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return false;
    }

    if (!authService.validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return false;
    }

    setErrors({});
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setErrors({ password: "Password is required" });
      return false;
    }

    if (!authService.validatePassword(password)) {
      setErrors({ password: "Password must be at least 8 characters long" });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleEmailSignIn = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmail({ email, password });
      // Navigation will be handled by auth state change
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="flex-1 px-6 py-8 pt-16">
        <VStack space="xl" className="flex-1 justify-center">
          {/* Header */}
          <VStack space="md" className="items-center mb-8">
            <Text
              size="3xl"
              className="font-bold text-typography-900 text-center"
            >
              Welcome Back
            </Text>
            <Text size="lg" className="text-typography-500 text-center">
              Sign in to access your debt management account
            </Text>
          </VStack>

          {/* Login Method Toggle */}
          <HStack space="sm" className="justify-center mb-4">
            <Button
              size="sm"
              variant={loginMethod === "phone" ? "solid" : "outline"}
              className={
                loginMethod === "phone"
                  ? "bg-primary-600"
                  : "border-background-300"
              }
              onPress={() => setLoginMethod("phone")}
            >
              <ButtonText
                className={
                  loginMethod === "phone" ? "text-white" : "text-typography-700"
                }
              >
                Phone
              </ButtonText>
            </Button>
            <Button
              size="sm"
              variant={loginMethod === "email" ? "solid" : "outline"}
              className={
                loginMethod === "email"
                  ? "bg-primary-600"
                  : "border-background-300"
              }
              onPress={() => setLoginMethod("email")}
            >
              <ButtonText
                className={
                  loginMethod === "email" ? "text-white" : "text-typography-700"
                }
              >
                Email
              </ButtonText>
            </Button>
          </HStack>

          {loginMethod === "phone" ? (
            <>
              {/* Phone Number Input */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Phone Number
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.phone}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    className="text-typography-900"
                  />
                </Input>
                {errors.phone && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.phone}
                  </Text>
                )}
                <Text size="xs" className="text-typography-400 mt-1">
                  We'll send you an OTP to verify your number
                </Text>
              </VStack>

              {/* Send OTP Button */}
              <Button
                size="lg"
                className="w-full bg-primary-600 hover:bg-primary-700"
                onPress={handleSendOTP}
                isDisabled={isLoading || isGoogleLoading}
              >
                <ButtonText className="font-semibold">
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </ButtonText>
              </Button>
            </>
          ) : (
            <>
              {/* Email Login Form */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Email Address
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.email}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    className="text-typography-900"
                  />
                </Input>
                {errors.email && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.email}
                  </Text>
                )}
              </VStack>

              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Password
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.password}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    className="text-typography-900"
                  />
                </Input>
                {errors.password && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.password}
                  </Text>
                )}
              </VStack>

              {/* Sign In Button */}
              <Button
                size="lg"
                className="w-full bg-primary-600 hover:bg-primary-700"
                onPress={handleEmailSignIn}
                isDisabled={isLoading || isGoogleLoading}
              >
                <ButtonText className="font-semibold">
                  {isLoading ? "Signing in..." : "Sign In"}
                </ButtonText>
              </Button>

              {/* Sign Up Link */}
              <HStack className="justify-center">
                <Text size="sm" className="text-typography-500">
                  Don't have an account?{" "}
                </Text>
                <Text
                  size="sm"
                  className="text-primary-600 font-medium"
                  onPress={() => navigation.navigate("SignUp")}
                >
                  Sign up here
                </Text>
              </HStack>
            </>
          )}

          {/* Divider */}
          <HStack space="md" className="items-center my-6">
            <Box className="flex-1 h-px bg-background-300" />
            <Text size="sm" className="text-typography-400 px-4">
              or continue with
            </Text>
            <Box className="flex-1 h-px bg-background-300" />
          </HStack>

          {/* Google Sign In Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full border-background-300"
            onPress={handleGoogleSignIn}
            isDisabled={isLoading || isGoogleLoading}
          >
            <ButtonText className="font-medium text-typography-700">
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </ButtonText>
          </Button>

          {/* Error Display */}
          {googleError && (
            <Box className="bg-error-50 p-3 rounded-lg border border-error-200">
              <Text size="sm" className="text-error-700 text-center">
                {googleError}
              </Text>
            </Box>
          )}

          {/* Footer */}
          <VStack space="sm" className="items-center mt-8">
            <Text size="sm" className="text-typography-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
}
