"use client"

import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import { Alert } from "react-native"

import { Box } from "@/components/ui/box"
import { HStack } from "@/components/ui/hstack"
import { Input, InputField } from "@/components/ui/input"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { QredColors } from "@/lib/constants/colors"
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth"
import { authService } from "@/lib/services/authService"
import { useAuthActions } from "@/lib/store/authStore"
import { Ionicons } from "@expo/vector-icons"

interface LoginScreenProps {
  navigation: any
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("email")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const { sendOTP, signInWithEmail } = useAuthActions()
  const { signInWithGoogle, isLoading: isGoogleLoading, error: googleError, clearError } = useGoogleAuth()

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) {
      setErrors({ phone: "Phone number is required" })
      return false
    }

    if (!authService.validatePhoneNumber(phone)) {
      setErrors({ phone: "Please enter a valid Nigerian phone number" })
      return false
    }

    setErrors({})
    return true
  }

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return
    }

    try {
      setIsLoading(true)
      const formattedPhone = authService.formatPhoneNumber(phoneNumber)

      await sendOTP(formattedPhone)

      navigation.navigate("OTP", {
        phoneNumber: formattedPhone,
      })
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      clearError()
      await signInWithGoogle()
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Google sign in failed")
    }
  }

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setErrors({ email: "Email is required" })
      return false
    }

    if (!authService.validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return false
    }

    setErrors({})
    return true
  }

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setErrors({ password: "Password is required" })
      return false
    }

    if (!authService.validatePassword(password)) {
      setErrors({ password: "Password must be at least 8 characters long" })
      return false
    }

    setErrors({})
    return true
  }

  const handleEmailSignIn = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return
    }

    try {
      setIsLoading(true)
      await signInWithEmail({ email, password })
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to sign in. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box className="flex-1" style={{ backgroundColor: QredColors.background.light }}>
      <Box className="relative">
        <LinearGradient
          colors={[QredColors.brand.navy, QredColors.brand.navyLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 280 }}
        />

        <Box className="px-6 pt-20 pb-12">
          <VStack space="md" className="items-center">
            <Box
              className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
              style={{
                backgroundColor: QredColors.accent.green,
                shadowColor: QredColors.accent.green,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="wallet" size={40} color="white" />
            </Box>

            <Text size="3xl" className="font-bold text-center" style={{ color: QredColors.text.inverse }}>
              Welcome to Qred
            </Text>
            <Text size="md" className="text-center opacity-90" style={{ color: QredColors.text.inverse }}>
              Your credit, simplified
            </Text>
          </VStack>
        </Box>
      </Box>

      <Box
        className="flex-1 px-6 -mt-8 rounded-t-3xl"
        style={{
          backgroundColor: QredColors.background.light,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <VStack space="xl" className="pt-8">
          <Box className="p-1 rounded-2xl" style={{ backgroundColor: QredColors.background.muted }}>
            <HStack space="xs">
              <Pressable style={{ flex: 1 }} onPress={() => setLoginMethod("email")}>
                <Box
                  className="py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: loginMethod === "email" ? QredColors.background.light : "transparent",
                    shadowColor: loginMethod === "email" ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: loginMethod === "email" ? 0.08 : 0,
                    shadowRadius: 4,
                    elevation: loginMethod === "email" ? 2 : 0,
                  }}
                >
                  <HStack space="xs" className="items-center">
                    <Ionicons
                      name="mail"
                      size={16}
                      color={loginMethod === "email" ? QredColors.brand.navy : QredColors.text.tertiary}
                    />
                    <Text
                      size="sm"
                      className="font-semibold"
                      style={{
                        color: loginMethod === "email" ? QredColors.brand.navy : QredColors.text.tertiary,
                      }}
                    >
                      Email
                    </Text>
                  </HStack>
                </Box>
              </Pressable>

              <Pressable style={{ flex: 1 }} onPress={() => setLoginMethod("phone")}>
                <Box
                  className="py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: loginMethod === "phone" ? QredColors.background.light : "transparent",
                    shadowColor: loginMethod === "phone" ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: loginMethod === "phone" ? 0.08 : 0,
                    shadowRadius: 4,
                    elevation: loginMethod === "phone" ? 2 : 0,
                  }}
                >
                  <HStack space="xs" className="items-center">
                    <Ionicons
                      name="phone-portrait"
                      size={16}
                      color={loginMethod === "phone" ? QredColors.brand.navy : QredColors.text.tertiary}
                    />
                    <Text
                      size="sm"
                      className="font-semibold"
                      style={{
                        color: loginMethod === "phone" ? QredColors.brand.navy : QredColors.text.tertiary,
                      }}
                    >
                      Phone
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
            </HStack>
          </Box>

          {loginMethod === "phone" ? (
            <>
              <VStack space="sm">
                <Text size="sm" className="font-semibold" style={{ color: QredColors.text.secondary }}>
                  Phone Number
                </Text>
                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.phone ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="call-outline" size={20} color={QredColors.text.tertiary} />
                    <Input variant="outline" size="lg" className="flex-1 border-0" isInvalid={!!errors.phone}>
                      <InputField
                        placeholder="080 1234 5678"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        style={{ color: QredColors.text.primary }}
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.phone && (
                  <HStack space="xs" className="items-center">
                    <Ionicons name="alert-circle" size={14} color={QredColors.status.error[500]} />
                    <Text size="xs" style={{ color: QredColors.status.error[500] }}>
                      {errors.phone}
                    </Text>
                  </HStack>
                )}
                <Text size="xs" style={{ color: QredColors.text.quaternary }}>
                  We'll send you a verification code
                </Text>
              </VStack>

              <Pressable onPress={handleSendOTP} disabled={isLoading || isGoogleLoading}>
                <LinearGradient
                  colors={[QredColors.accent.green, QredColors.accent.greenDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    shadowColor: QredColors.accent.green,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <HStack space="sm" className="items-center justify-center">
                    {isLoading ? (
                      <Ionicons name="hourglass-outline" size={20} color="white" />
                    ) : (
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    )}
                    <Text size="md" className="font-bold text-white">
                      {isLoading ? "Sending..." : "Send Code"}
                    </Text>
                  </HStack>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <VStack space="sm">
                <Text size="sm" className="font-semibold" style={{ color: QredColors.text.secondary }}>
                  Email Address
                </Text>
                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.email ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="mail-outline" size={20} color={QredColors.text.tertiary} />
                    <Input variant="outline" size="lg" className="flex-1 border-0" isInvalid={!!errors.email}>
                      <InputField
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoComplete="email"
                        autoCapitalize="none"
                        style={{ color: QredColors.text.primary }}
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.email && (
                  <HStack space="xs" className="items-center">
                    <Ionicons name="alert-circle" size={14} color={QredColors.status.error[500]} />
                    <Text size="xs" style={{ color: QredColors.status.error[500] }}>
                      {errors.email}
                    </Text>
                  </HStack>
                )}
              </VStack>

              <VStack space="sm">
                <Text size="sm" className="font-semibold" style={{ color: QredColors.text.secondary }}>
                  Password
                </Text>
                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.password ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="lock-closed-outline" size={20} color={QredColors.text.tertiary} />
                    <Input variant="outline" size="lg" className="flex-1 border-0" isInvalid={!!errors.password}>
                      <InputField
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        style={{ color: QredColors.text.primary }}
                      />
                    </Input>
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={QredColors.text.tertiary}
                      />
                    </Pressable>
                  </HStack>
                </Box>
                {errors.password && (
                  <HStack space="xs" className="items-center">
                    <Ionicons name="alert-circle" size={14} color={QredColors.status.error[500]} />
                    <Text size="xs" style={{ color: QredColors.status.error[500] }}>
                      {errors.password}
                    </Text>
                  </HStack>
                )}
              </VStack>

              <Pressable onPress={handleEmailSignIn} disabled={isLoading || isGoogleLoading}>
                <LinearGradient
                  colors={[QredColors.accent.green, QredColors.accent.greenDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    shadowColor: QredColors.accent.green,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <HStack space="sm" className="items-center justify-center">
                    {isLoading ? (
                      <Ionicons name="hourglass-outline" size={20} color="white" />
                    ) : (
                      <Ionicons name="log-in-outline" size={20} color="white" />
                    )}
                    <Text size="md" className="font-bold text-white">
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Text>
                  </HStack>
                </LinearGradient>
              </Pressable>

              <HStack className="justify-center">
                <Text size="sm" style={{ color: QredColors.text.tertiary }}>
                  Don't have an account?{" "}
                </Text>
                <Pressable onPress={() => navigation.navigate("SignUp")}>
                  <Text size="sm" className="font-bold" style={{ color: QredColors.accent.green }}>
                    Sign up
                  </Text>
                </Pressable>
              </HStack>
            </>
          )}

          <HStack space="md" className="items-center my-2">
            <Box className="flex-1 h-px" style={{ backgroundColor: QredColors.border.light }} />
            <Text size="xs" style={{ color: QredColors.text.quaternary }}>
              OR
            </Text>
            <Box className="flex-1 h-px" style={{ backgroundColor: QredColors.border.light }} />
          </HStack>

          <Pressable onPress={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            <Box
              className="py-4 px-6 rounded-xl"
              style={{
                backgroundColor: QredColors.background.elevated,
                borderWidth: 1.5,
                borderColor: QredColors.border.light,
              }}
            >
              <HStack space="md" className="items-center justify-center">
                <Ionicons name="logo-google" size={20} color={QredColors.text.secondary} />
                <Text size="sm" className="font-semibold" style={{ color: QredColors.text.secondary }}>
                  {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                </Text>
              </HStack>
            </Box>
          </Pressable>

          {googleError && (
            <Box
              className="p-4 rounded-xl"
              style={{
                backgroundColor: QredColors.status.error[50],
                borderWidth: 1,
                borderColor: QredColors.status.error[200],
              }}
            >
              <HStack space="sm" className="items-start">
                <Ionicons name="alert-circle" size={16} color={QredColors.status.error[600]} />
                <Text size="sm" className="flex-1" style={{ color: QredColors.status.error[700] }}>
                  {googleError}
                </Text>
              </HStack>
            </Box>
          )}

          <VStack space="sm" className="items-center mt-4 pb-8">
            <Text size="xs" className="text-center" style={{ color: QredColors.text.quaternary }}>
              By continuing, you agree to our{" "}
              <Text size="xs" className="font-medium" style={{ color: QredColors.text.tertiary }}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text size="xs" className="font-medium" style={{ color: QredColors.text.tertiary }}>
                Privacy Policy
              </Text>
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Box>
  )
}
