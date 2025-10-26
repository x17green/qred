import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useAuthActions } from "@/lib/store/authStore";
import { authService } from "@/lib/services/authService";

interface SignUpScreenProps {
  navigation: any;
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { signUpWithEmail } = useAuthActions();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!authService.validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (!authService.validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate phone number (optional but if provided, must be valid)
    if (phoneNumber.trim() && !authService.validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Nigerian phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const formattedPhone = phoneNumber.trim()
        ? authService.formatPhoneNumber(phoneNumber)
        : undefined;

      const response = await signUpWithEmail({
        name,
        email,
        password,
        phoneNumber: formattedPhone,
      });

      if (response.requiresEmailConfirmation) {
        Alert.alert(
          "Check Your Email",
          "We've sent you a confirmation link. Please check your email and click the link to complete your registration.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        // User is automatically signed in
        Alert.alert(
          "Welcome!",
          "Your account has been created successfully.",
          [
            {
              text: "OK",
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Sign Up Failed",
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView className="flex-1">
        <Box className="flex-1 px-6 py-8 pt-16">
          <VStack space="xl" className="flex-1">
            {/* Header */}
            <VStack space="md" className="items-center mb-8">
              <Text
                size="3xl"
                className="font-bold text-typography-900 text-center"
              >
                Create Account
              </Text>
              <Text size="lg" className="text-typography-500 text-center">
                Join Qred to manage your debts and credits
              </Text>
            </VStack>

            {/* Form */}
            <VStack space="lg">
              {/* Name Input */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Full Name *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.name}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    className="text-typography-900"
                  />
                </Input>
                {errors.name && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.name}
                  </Text>
                )}
              </VStack>

              {/* Email Input */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Email Address *
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

              {/* Phone Number Input (Optional) */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Phone Number (Optional)
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.phoneNumber}
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
                {errors.phoneNumber && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.phoneNumber}
                  </Text>
                )}
                <Text size="xs" className="text-typography-400 mt-1">
                  We'll use this for OTP verification when needed
                </Text>
              </VStack>

              {/* Password Input */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Password *
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
                    autoComplete="new-password"
                    className="text-typography-900"
                  />
                </Input>
                {errors.password && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.password}
                  </Text>
                )}
                <Text size="xs" className="text-typography-400 mt-1">
                  Password must be at least 8 characters long
                </Text>
              </VStack>

              {/* Confirm Password Input */}
              <VStack space="sm">
                <Text size="sm" className="font-medium text-typography-700">
                  Confirm Password *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.confirmPassword}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    className="text-typography-900"
                  />
                </Input>
                {errors.confirmPassword && (
                  <Text size="sm" className="text-error-600 mt-1">
                    {errors.confirmPassword}
                  </Text>
                )}
              </VStack>

              {/* Sign Up Button */}
              <Button
                size="lg"
                className="w-full bg-primary-600 hover:bg-primary-700 mt-6"
                onPress={handleSignUp}
                isDisabled={isLoading}
              >
                <ButtonText className="font-semibold">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </ButtonText>
              </Button>

              {/* Sign In Link */}
              <HStack className="justify-center mt-4">
                <Text size="sm" className="text-typography-500">
                  Already have an account?{" "}
                </Text>
                <Text
                  size="sm"
                  className="text-primary-600 font-medium"
                  onPress={() => navigation.navigate("Login")}
                >
                  Sign in here
                </Text>
              </HStack>
            </VStack>

            {/* Footer */}
            <VStack space="sm" className="items-center mt-8">
              <Text size="sm" className="text-typography-500 text-center">
                By creating an account, you agree to our Terms of Service and
                Privacy Policy
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
