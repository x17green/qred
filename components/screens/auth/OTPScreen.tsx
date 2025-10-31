import { StackScreenProps } from "@react-navigation/stack";
import React, { useEffect, useRef, useState } from "react";
import { Alert, TextInput } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { BorderRadius, QredColors, Shadows } from "@/lib/constants/colors";
import { authService } from "@/lib/services/authService";
import { useAuthActions } from "@/lib/store/authStore";
import { AuthStackParamList } from "@/types";

type OTPScreenProps = StackScreenProps<AuthStackParamList, "OTP">;

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
    <Box className="flex-1 bg-background-0">
      <Box className="flex-1 px-6 py-8 pt-16">
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
                  className="w-14 h-14 items-center justify-center"
                  isInvalid={!!error}
                  style={{
                    borderWidth: 1.5,
                    borderColor: error ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                    borderRadius: BorderRadius.md,
                  }}
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
                    className="text-xl font-bold"
                    style={{ color: QredColors.text.primary }}
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
            className="w-full"
            onPress={handleVerifyOtp}
            isDisabled={isLoading || otp.join("").length !== 6}
            style={{
              backgroundColor: QredColors.brand.navy,
              borderRadius: BorderRadius.lg,
              ...Shadows.md,
            }}
          >
            <ButtonText className="font-semibold text-white">
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
            className="w-full"
            onPress={() => navigation.goBack()}
            style={{
              borderColor: QredColors.border.medium,
              backgroundColor: QredColors.background.muted,
              borderRadius: BorderRadius.md,
            }}
          >
            <ButtonText style={{ color: QredColors.text.secondary }}>
              Change Phone Number
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
