"use client"

import { LinearGradient } from "expo-linear-gradient"
import { CheckCircle, Lock, Mail, Phone, User } from "lucide-react-native"
import { useState } from "react"
import { Alert, ScrollView } from "react-native"

import { Box } from "@/components/ui/box"
import { Button, ButtonText } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { QredColors } from "@/lib/constants/colors"
import { authService } from "@/lib/services/authService"
import { useAuthActions } from "@/lib/store/authStore"

interface SignUpScreenProps {
  navigation: any
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { signUpWithEmail } = useAuthActions()

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!authService.validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = "Password is required"
    } else if (!authService.validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters long"
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Validate phone number (optional but if provided, must be valid)
    if (phoneNumber.trim() && !authService.validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Nigerian phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignUp = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const formattedPhone = phoneNumber.trim() ? authService.formatPhoneNumber(phoneNumber) : undefined

      const response = await signUpWithEmail({
        name,
        email,
        password,
        phoneNumber: formattedPhone,
      })

      if (response.requiresEmailConfirmation) {
        Alert.alert(
          "Check Your Email",
          "We've sent you a confirmation link. Please check your email and click the link to complete your registration.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ],
        )
      } else {
        // User is automatically signed in
        Alert.alert("Welcome!", "Your account has been created successfully.", [
          {
            text: "OK",
          },
        ])
      }
    } catch (error) {
      Alert.alert(
        "Sign Up Failed",
        error instanceof Error ? error.message : "Failed to create account. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box className="flex-1">
      <LinearGradient
        colors={[QredColors.brand.navy, QredColors.brand.navyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="flex-1 px-6 py-8 pt-16">
          <VStack space="xl" className="flex-1">
            <VStack space="md" className="items-center mb-4">
              <Text size="3xl" className="font-bold text-white text-center">
                Create Account
              </Text>
              <Text size="md" className="text-white/70 text-center px-4">
                Join Qred to manage your debts and credits effortlessly
              </Text>
            </VStack>

            <Box
              className="bg-white rounded-3xl p-6"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <VStack space="lg">
                <VStack space="sm">
                  <Text size="sm" className="font-semibold text-typography-900">
                    Full Name
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!errors.name}
                    className="border-2 border-background-200 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.name ? QredColors.status.error[500] : QredColors.border.light,
                      backgroundColor: QredColors.background.elevated,
                    }}
                  >
                    <InputSlot className="pl-3">
                      <InputIcon as={User} className="text-typography-400" size="sm" />
                    </InputSlot>
                    <InputField
                      placeholder="Enter your full name"
                      value={name}
                      onChangeText={setName}
                      autoComplete="name"
                      className="text-typography-900 pl-2"
                    />
                  </Input>
                  {errors.name && (
                    <Text size="sm" className="text-error-600">
                      {errors.name}
                    </Text>
                  )}
                </VStack>

                <VStack space="sm">
                  <Text size="sm" className="font-semibold text-typography-900">
                    Email Address
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!errors.email}
                    className="border-2 border-background-200 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.email ? QredColors.status.error[500] : QredColors.border.light,
                      backgroundColor: QredColors.background.elevated,
                    }}
                  >
                    <InputSlot className="pl-3">
                      <InputIcon as={Mail} className="text-typography-400" size="sm" />
                    </InputSlot>
                    <InputField
                      placeholder="Enter your email address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoComplete="email"
                      autoCapitalize="none"
                      className="text-typography-900 pl-2"
                    />
                  </Input>
                  {errors.email && (
                    <Text size="sm" className="text-error-600">
                      {errors.email}
                    </Text>
                  )}
                </VStack>

                <VStack space="sm">
                  <Text size="sm" className="font-semibold text-typography-900">
                    Phone Number <Text className="text-typography-400">(Optional)</Text>
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!errors.phoneNumber}
                    className="border-2 border-background-200 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.phoneNumber ? QredColors.status.error[500] : QredColors.border.light,
                      backgroundColor: QredColors.background.elevated,
                    }}
                  >
                    <InputSlot className="pl-3">
                      <InputIcon as={Phone} className="text-typography-400" size="sm" />
                    </InputSlot>
                    <InputField
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      className="text-typography-900 pl-2"
                    />
                  </Input>
                  {errors.phoneNumber && (
                    <Text size="sm" className="text-error-600">
                      {errors.phoneNumber}
                    </Text>
                  )}
                  {!errors.phoneNumber && (
                    <Text size="xs" className="text-typography-500">
                      For OTP verification when needed
                    </Text>
                  )}
                </VStack>

                <VStack space="sm">
                  <Text size="sm" className="font-semibold text-typography-900">
                    Password
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!errors.password}
                    className="border-2 border-background-200 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.password ? QredColors.status.error[500] : QredColors.border.light,
                      backgroundColor: QredColors.background.elevated,
                    }}
                  >
                    <InputSlot className="pl-3">
                      <InputIcon as={Lock} className="text-typography-400" size="sm" />
                    </InputSlot>
                    <InputField
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="new-password"
                      className="text-typography-900 pl-2"
                    />
                  </Input>
                  {errors.password && (
                    <Text size="sm" className="text-error-600">
                      {errors.password}
                    </Text>
                  )}
                  {!errors.password && (
                    <Text size="xs" className="text-typography-500">
                      Minimum 8 characters
                    </Text>
                  )}
                </VStack>

                <VStack space="sm">
                  <Text size="sm" className="font-semibold text-typography-900">
                    Confirm Password
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!errors.confirmPassword}
                    className="border-2 border-background-200 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.confirmPassword ? QredColors.status.error[500] : QredColors.border.light,
                      backgroundColor: QredColors.background.elevated,
                    }}
                  >
                    <InputSlot className="pl-3">
                      <InputIcon as={CheckCircle} className="text-typography-400" size="sm" />
                    </InputSlot>
                    <InputField
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoComplete="new-password"
                      className="text-typography-900 pl-2"
                    />
                  </Input>
                  {errors.confirmPassword && (
                    <Text size="sm" className="text-error-600">
                      {errors.confirmPassword}
                    </Text>
                  )}
                </VStack>

                <Box className="mt-4">
                  <Button
                    size="lg"
                    className="w-full rounded-xl"
                    onPress={handleSignUp}
                    isDisabled={isLoading}
                    style={{
                      backgroundColor: QredColors.accent.green,
                      shadowColor: QredColors.accent.green,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <ButtonText className="font-bold text-base">
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </ButtonText>
                  </Button>
                </Box>

                <HStack className="justify-center mt-2">
                  <Text size="sm" className="text-typography-600">
                    Already have an account?{" "}
                  </Text>
                  <Text
                    size="sm"
                    className="font-bold"
                    style={{ color: QredColors.brand.navy }}
                    onPress={() => navigation.navigate("Login")}
                  >
                    Sign in
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <VStack space="sm" className="items-center mt-6 px-8">
              <Text size="xs" className="text-white/60 text-center leading-5">
                By creating an account, you agree to our{" "}
                <Text className="text-white/80 font-medium">Terms of Service</Text> and{" "}
                <Text className="text-white/80 font-medium">Privacy Policy</Text>
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  )
}
