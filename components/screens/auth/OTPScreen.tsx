import React, { useState, useEffect, useRef } from "react";
import { Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useAuthActions } from "@/store/authStore";
import { authService } from "@/services/authService";

interface OTPScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
      email?: string;
      name?: string;
    };
  };
}

export default function OTPScreen({ navigation, route }: OTPScreenProps) {
  const { phoneNumber, email, name } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { signIn, sendOTP } = useAuthActions();

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, 6).split("");
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus on the last filled input or next empty one
      const nextIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    if (!authService.validateOTP(otpString)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const googleProfile = email && name ? { email, name } : undefined;

      await signIn(phoneNumber, otpString, googleProfile);

      // Navigation will be handled by the auth state change
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Invalid OTP. Please try again.",
      );

      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      setError("");

      await sendOTP(phoneNumber);

      // Reset timer
      setTimer(60);
      setCanResend(false);

      Alert.alert("Success", "OTP sent successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to resend OTP",
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.startsWith("+234")) {
      return phone.replace("+234", "0");
    }
    return phone;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <Box className="flex-1 px-6 py-8">
        <VStack space="xl" className="flex-1 justify-center">
          {/* Header */}
          <VStack space="md" className="items-center mb-8">
            <Text
              size="3xl"
              className="font-bold text-typography-900 text-center"
            >
              Verify OTP
            </Text>
            <Text size="lg" className="text-typography-500 text-center">
              Enter the 6-digit code sent to
            </Text>
            <Text size="lg" className="font-semibold text-typography-900">
              {formatPhoneNumber(phoneNumber)}
            </Text>
          </VStack>

          {/* OTP Input */}
          <VStack space="md">
            <HStack space="sm" className="justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  variant="outline"
                  size="lg"
                  className="w-14 h-14 border-background-300 items-center justify-center"
                  isInvalid={!!error}
                >
                  <InputField
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="center"
                    className="text-xl font-bold text-typography-900"
                    selectTextOnFocus
                  />
                </Input>
              ))}
            </HStack>

            {error && (
              <Text size="sm" className="text-error-600 text-center">
                {error}
              </Text>
            )}
          </VStack>

          {/* Verify Button */}
          <Button
            size="lg"
            className="w-full bg-primary-600 hover:bg-primary-700"
            onPress={handleVerifyOtp}
            isDisabled={isLoading || otp.join("").length !== 6}
          >
            <ButtonText className="font-semibold">
              {isLoading ? "Verifying..." : "Verify OTP"}
            </ButtonText>
          </Button>

          {/* Resend OTP */}
          <VStack space="sm" className="items-center">
            <Text size="sm" className="text-typography-500">
              Didn't receive the code?
            </Text>

            {canResend ? (
              <Button
                variant="link"
                size="sm"
                onPress={handleResendOtp}
                isDisabled={isResending}
              >
                <ButtonText className="font-semibold text-primary-600">
                  {isResending ? "Resending..." : "Resend OTP"}
                </ButtonText>
              </Button>
            ) : (
              <Text size="sm" className="text-typography-400">
                Resend in {formatTimer(timer)}
              </Text>
            )}
          </VStack>

          {/* Back Button */}
          <Button
            variant="outline"
            size="md"
            className="w-full border-background-300 mt-4"
            onPress={() => navigation.goBack()}
          >
            <ButtonText className="text-typography-700">
              Change Phone Number
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
