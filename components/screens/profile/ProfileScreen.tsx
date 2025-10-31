"use client"

import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import {
    Bell,
    Camera,
    ChevronRight,
    Download,
    HelpCircle,
    Info,
    LogOut,
    Mail,
    Phone,
    Settings,
    User,
} from "lucide-react-native"
import type React from "react"
import { useEffect, useState } from "react"
import { Alert, ScrollView } from "react-native"

import { Box } from "@/components/ui/box"
import { Button, ButtonText } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Image } from "@/components/ui/image"
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { BorderRadius, QredColors, SemanticColors, Shadows } from "@/lib/constants/colors"
import { authService } from "@/lib/services/authService"
import { storageService } from "@/lib/services/storageService"
import { useAuth, useAuthActions } from "@/lib/store/authStore"

interface ProfileScreenProps {
  navigation: any
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isLoading } = useAuth()
  const { signOut, updateProfile } = useAuthActions()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    avatarUri: null as string | null,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Initialize edit data when user data loads
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        avatarUri: null,
      })
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Validate name
    if (!editData.name.trim()) {
      newErrors.name = "Name is required"
    }

    // Validate email
    if (!editData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!authService.validateEmail(editData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate phone number (optional but if provided, must be valid)
    if (editData.phoneNumber.trim() && !authService.validatePhoneNumber(editData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Nigerian phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsUpdating(true)

      let avatarUrl: string | null = user?.avatarUrl || null

      // Upload new avatar if selected
      if (editData.avatarUri) {
        setIsUploadingAvatar(true)
        try {
          const uploadResponse = await storageService.uploadAvatar({
            userId: user!.id,
            imageUri: editData.avatarUri,
          })
          avatarUrl = uploadResponse.publicUrl
        } catch (error) {
          console.error("Avatar upload error:", error)
          Alert.alert("Upload Error", "Failed to upload profile picture. Your other changes will still be saved.")
        } finally {
          setIsUploadingAvatar(false)
        }
      }

      const formattedPhone = editData.phoneNumber.trim() ? authService.formatPhoneNumber(editData.phoneNumber) : null

      await updateProfile({
        name: editData.name.trim(),
        email: editData.email.trim(),
        phoneNumber: formattedPhone,
        avatarUrl,
      })

      setIsEditing(false)
      Alert.alert("Success", "Your profile has been updated successfully.")
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        avatarUri: null,
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Validate file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Error", "Image size must be less than 5MB")
          return
        }

        setEditData((prev) => ({ ...prev, avatarUri: asset.uri }))
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.")
      console.error("Image selection error:", error)
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need camera permissions to take a photo.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Validate file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Error", "Image size must be less than 5MB")
          return
        }

        setEditData((prev) => ({ ...prev, avatarUri: asset.uri }))
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.")
      console.error("Camera error:", error)
    }
  }

  const showImagePicker = () => {
    Alert.alert("Change Profile Picture", "Choose how you'd like to update your profile picture", [
      {
        text: "Camera",
        onPress: takePhoto,
      },
      {
        text: "Photo Library",
        onPress: selectImage,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut()
            // Navigation will be handled by auth state change
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to sign out")
          }
        },
      },
    ])
  }

  return (
    <Box className="flex-1" style={{ backgroundColor: SemanticColors.secondarySurface }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="overflow-hidden">
          <LinearGradient
            colors={[QredColors.brand.navy, QredColors.brand.navyDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
          >
            <VStack space="lg" className="items-center">
              <Pressable onPress={isEditing ? showImagePicker : undefined}>
                <Box
                  className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/25"
                  style={{
                    ...Shadows.lg,
                  }}
                >
                  {editData.avatarUri || user?.avatarUrl ? (
                    <Image
                      source={{ uri: editData.avatarUri || user?.avatarUrl || "" }}
                      alt="Profile picture"
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Box
                      className="w-full h-full rounded-full items-center justify-center"
                      style={{ backgroundColor: QredColors.accent.green, borderRadius: BorderRadius.full }}
                    >
                      <Text size="5xl" className="font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </Box>
                  )}

                  {isEditing && (
                    <Box
                      className="w-10 h-10 rounded-full items-center justify-center border-2 border-white"
                      style={{
                        backgroundColor: QredColors.accent.green,
                        position: 'absolute',
                        bottom: -8,
                        right: -8,
                        borderRadius: BorderRadius.full,
                      }}
                    >
                      <Camera size={20} color="white" />
                    </Box>
                  )}
                </Box>
              </Pressable>

              <VStack space="xs" className="items-center">
                <Text size="3xl" className="font-bold text-white">
                  {user?.name || "User"}
                </Text>
                <Text size="md" className="text-white/70">
                  {user?.email || "No email address"}
                </Text>
                {user?.phoneNumber && (
                  <Text size="lg" className="text-white/70">
                    {user.phoneNumber}
                  </Text>
                )}
              </VStack>
            </VStack>
          </LinearGradient>
        </Box>

        <Box className="px-6 py-6">
          <VStack space="xl">
            {isEditing ? (
              <Box
                className="bg-white rounded-2xl p-6 border border-background-200"
                style={{
                  ...Shadows.md,
                  borderWidth: 1.5,
                  borderColor: QredColors.border.light,
                }}
              >
                <VStack space="xs">
                  <Text size="lg" className="font-bold text-typography-900">
                    Edit Profile
                  </Text>

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
                        <InputIcon as={User} className="text-typography-100" size="sm" />
                      </InputSlot>
                      <InputField
                        placeholder="Enter your full name"
                        value={editData.name}
                        onChangeText={(text) => setEditData({ ...editData, name: text })}
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
                        value={editData.email}
                        onChangeText={(text) => setEditData({ ...editData, email: text })}
                        keyboardType="email-address"
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
                      Phone Number
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
                        value={editData.phoneNumber}
                        onChangeText={(text) => setEditData({ ...editData, phoneNumber: text })}
                        keyboardType="phone-pad"
                        className="text-typography-900 pl-2"
                      />
                    </Input>
                    {errors.phoneNumber && (
                      <Text size="sm" className="text-error-600">
                        {errors.phoneNumber}
                      </Text>
                    )}
                  </VStack>

                  <HStack space="md" className="mt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2 border-background-300 rounded-xl bg-transparent"
                      onPress={handleCancelEdit}
                      isDisabled={isUpdating}
                      style={{
                        borderColor: QredColors.status.error[100],
                        backgroundColor: QredColors.background.elevated,
                      }}
                    >
                      <ButtonText className="font-semibold color-red-500">Cancel</ButtonText>
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 rounded-xl"
                      onPress={handleSaveProfile}
                      isDisabled={isUpdating}
                      style={{
                        backgroundColor: QredColors.accent.green,
                        ...Shadows.md,
                      }}
                    >
                      <ButtonText className="text-white font-bold">
                        {isUpdating ? (isUploadingAvatar ? "Uploading..." : "Saving...") : "Save Changes"}
                      </ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ) : null}

            <VStack space="md">
              <ProfileMenuItem
                title="Edit Profile"
                description="Update your personal information"
                icon={User}
                onPress={() => setIsEditing(true)}
                disabled={isEditing || isUpdating}
              />

              <ProfileMenuItem
                title="Security Settings"
                description="Manage your account security"
                icon={Settings}
                onPress={() => {
                  Alert.alert("Coming Soon", "Security settings will be implemented")
                }}
              />

              <ProfileMenuItem
                title="Notifications"
                description="Configure notification preferences"
                icon={Bell}
                onPress={() => {
                  Alert.alert("Coming Soon", "Notification settings will be implemented")
                }}
              />

              <ProfileMenuItem
                title="Export Data"
                description="Download your debt records"
                icon={Download}
                onPress={() => {
                  Alert.alert("Coming Soon", "Data export feature will be implemented")
                }}
              />

              <ProfileMenuItem
                title="Help & Support"
                description="Get help or contact support"
                icon={HelpCircle}
                onPress={() => {
                  Alert.alert("Coming Soon", "Help & support section will be implemented")
                }}
              />

              <ProfileMenuItem
                title="About"
                description="App version and information"
                icon={Info}
                onPress={() => {
                  Alert.alert("About", `Qred v${process.env.EXPO_PUBLIC_APP_VERSION}\nYour credit, simplified\n\nA modern debt management application`)
                }}
              />
            </VStack>

            <Box className="mt-8">
              <Button
                variant="outline"
                size="xl"
                className="w-full border-2 rounded-xl bg-transparent"
                onPress={handleSignOut}
                isDisabled={isLoading || isUpdating || isUploadingAvatar}
                style={{
                  borderColor: QredColors.status.error[700],
                  backgroundColor: QredColors.status.error[600],
                  borderWidth: 1.5,
                  borderRadius: BorderRadius.lg,
                  height: 56,
                }}
              >
                <LogOut size={20} color={QredColors.surface.card} />
                <ButtonText className="font-bold ml-2" style={{ color: QredColors.surface.card }}>
                  {isLoading ? "Signing Out..." : "Sign Out"}
                </ButtonText>
              </Button>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  )
}

function ProfileMenuItem({
  title,
  description,
  icon: Icon,
  onPress,
  disabled = false,
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable onPress={disabled ? undefined : onPress}>
      <Box
        className={`bg-white rounded-2xl p-5 border border-background-200 ${disabled ? "opacity-50" : ""}`}
        style={{
          ...Shadows.sm,
          borderWidth: 1.5,
          borderColor: QredColors.border.light,
        }}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" space="md">
            <Box
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: QredColors.surface.elevated }}
            >
              <Icon size={20} color={QredColors.brand.navy} />
            </Box>
            <VStack className="flex-1">
              <Text size="md" className={`font-bold ${disabled ? "text-typography-400" : "text-typography-900"}`}>
                {title}
              </Text>
              <Text size="sm" className="text-typography-500 mt-1">
                {description}
              </Text>
            </VStack>
          </HStack>
          <ChevronRight size={20} color={disabled ? QredColors.text.tertiary : QredColors.text.quaternary} />
        </HStack>
      </Box>
    </Pressable>
  )
}
