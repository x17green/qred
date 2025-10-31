import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { BorderRadius, QredColors, Shadows } from "@/lib/constants/colors";
import { authService } from "@/lib/services/authService";
import { storageService } from "@/lib/services/storageService";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { Ionicons } from "@expo/vector-icons";

interface OnboardingScreenProps {
  navigation: any;
}

interface ProfileForm {
  name: string;
  phoneNumber: string;
  avatarUri: string | null;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { user, authUser, isLoading } = useAuth();
  const { updateProfile, setLoading } = useAuthActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name || authUser?.user_metadata?.name || "",
    phoneNumber: user?.phoneNumber || authUser?.phone || "",
    avatarUri: null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Request camera/gallery permissions
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to let you select a profile picture."
        );
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate name
    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Validate phone number (optional but if provided, must be valid)
    if (form.phoneNumber.trim()) {
      if (!authService.validatePhoneNumber(form.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid Nigerian phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Error", "Image size must be less than 5MB");
          return;
        }

        setForm(prev => ({ ...prev, avatarUri: asset.uri }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
      console.error("Image selection error:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera permissions to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Error", "Image size must be less than 5MB");
          return;
        }

        setForm(prev => ({ ...prev, avatarUri: asset.uri }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
      console.error("Camera error:", error);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Select Profile Picture",
      "Choose how you'd like to set your profile picture",
      [
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
      ]
    );
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!form.avatarUri || !authUser?.id) return null;

    try {
      setIsUploadingAvatar(true);

      const uploadResponse = await storageService.uploadAvatar({
        userId: authUser.id,
        imageUri: form.avatarUri,
      });

      return uploadResponse.publicUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert(
        "Upload Error",
        "Failed to upload profile picture. You can add it later from your profile."
      );
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) {
      return;
    }

    if (!authUser?.id) {
      Alert.alert("Error", "Authentication error. Please try logging in again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);

      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (form.avatarUri) {
        avatarUrl = await uploadAvatar();
      }

      // Format phone number if provided
      const formattedPhone = form.phoneNumber.trim()
        ? authService.formatPhoneNumber(form.phoneNumber)
        : null;

      // Update profile
      const updatedUser = await updateProfile({
        name: form.name.trim(),
        phoneNumber: formattedPhone,
        avatarUrl,
      });

      // Check if role selection is still needed
      if (!updatedUser.hasCompletedRoleSelection) {
        Alert.alert(
          "Profile Complete!",
          "Now let's set up how you'll use Qred.",
          [
            {
              text: "Continue",
              onPress: () => {
                // Navigation to role selection will be handled by auth state change
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Welcome to Qred!",
          "Your profile has been set up successfully. Let's start managing your debts!",
          [
            {
              text: "Get Started",
              onPress: () => {
                // Navigation will be handled by auth state change
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to complete profile setup. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const skipForNow = () => {
    Alert.alert(
      "Skip Profile Setup",
      "You can complete your profile later from the Profile tab. Continue to the app?",
      [
        {
          text: "Complete Now",
          style: "cancel",
        },
        {
          text: "Skip",
          onPress: async () => {
            try {
              setLoading(true);
              // Set a minimal name if not provided
              if (!user?.name || user.name === "User") {
                await updateProfile({
                  name: authUser?.user_metadata?.name || "Qred User",
                });
              }
              // Note: Role selection will still be required after this skip
            } catch (error) {
              console.error("Skip profile error:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getAvatarDisplay = () => {
    if (form.avatarUri) {
      return (
        <Image
          source={{ uri: form.avatarUri }}
          alt="Profile picture"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 50,
          }}
          resizeMode="cover"
        />
      );
    }

    return (
      <Box
        className="w-full h-full rounded-full items-center justify-center"
        style={{
          backgroundColor: QredColors.brand.navyLight,
          borderRadius: BorderRadius.full,
        }}
      >
        <Ionicons
          name="camera-outline"
          size={40}
          color={QredColors.brand.navy}
        />
      </Box>
    );
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-8 pt-16">
          <VStack space="xl">
            {/* Header */}
            <VStack space="md" className="items-center">
              <Text size="2xl" className="font-bold text-typography-900 text-center">
                Complete Your Profile
              </Text>
              <Text size="md" className="text-typography-600 text-center">
                Let's set up your profile to get started with Qred
              </Text>
            </VStack>

            {/* Avatar Upload */}
            <VStack space="md" className="items-center">
              <Text size="lg" className="font-semibold text-typography-900">
                Profile Picture
              </Text>

              <Pressable onPress={showImagePicker} style={{ position: 'relative' }}>
                <Box
                  className="w-32 h-32 border-4"
                  style={{
                    borderRadius: BorderRadius.full,
                    borderColor: QredColors.brand.navyLight,
                  }}
                >
                  {getAvatarDisplay()}
                </Box>

                {/* Camera icon overlay */}
                <Box
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full items-center justify-center border-4"
                  style={{
                    backgroundColor: QredColors.brand.navy,
                    borderColor: QredColors.background.light,
                    borderRadius: BorderRadius.full,
                    ...Shadows.sm,
                  }}
                >
                  <Ionicons
                    name="camera"
                    size={20}
                    color={QredColors.text.inverse}
                  />
                </Box>
              </Pressable>

              <Text size="sm" className="text-typography-500 text-center">
                Tap to {form.avatarUri ? "change" : "add"} your profile picture
              </Text>
            </VStack>

            {/* Form Fields */}
            <VStack space="lg">
              {/* Name Input */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Full Name *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.name}
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.name ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <InputField
                    placeholder="Enter your full name"
                    value={form.name}
                    onChangeText={(text) =>
                      setForm(prev => ({ ...prev, name: text }))
                    }
                    style={{ color: QredColors.text.primary }}
                    autoCapitalize="words"
                  />
                </Input>
                {errors.name && (
                  <Text size="sm" className="text-error-600">
                    {errors.name}
                  </Text>
                )}
              </VStack>

              {/* Phone Number Input */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Phone Number
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.phoneNumber}
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.phoneNumber ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <InputField
                    placeholder="Enter your phone number (optional)"
                    value={form.phoneNumber}
                    onChangeText={(text) =>
                      setForm(prev => ({ ...prev, phoneNumber: text }))
                    }
                    keyboardType="phone-pad"
                    style={{ color: QredColors.text.primary }}
                  />
                </Input>
                {errors.phoneNumber && (
                  <Text size="sm" className="text-error-600">
                    {errors.phoneNumber}
                  </Text>
                )}
                <Text size="sm" className="text-typography-500">
                  This helps others find and add you for debt tracking
                </Text>
              </VStack>
            </VStack>

            {/* Action Buttons */}
            <VStack space="md" className="mt-8">
              <Button
                size="lg"
                className="w-full"
                onPress={handleCompleteProfile}
                isDisabled={isSubmitting || isLoading || isUploadingAvatar}
                style={{
                  backgroundColor: QredColors.brand.navy,
                  borderRadius: BorderRadius.lg,
                  ...Shadows.md,
                }}
              >
                <ButtonText className="text-white font-semibold">
                  {isSubmitting
                    ? isUploadingAvatar
                      ? "Uploading Picture..."
                      : "Setting Up Profile..."
                    : "Complete Profile"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onPress={skipForNow}
                isDisabled={isSubmitting || isLoading}
                style={{
                  borderColor: QredColors.border.medium,
                  backgroundColor: QredColors.background.muted,
                  borderRadius: BorderRadius.md,
                }}
              >
                <ButtonText style={{ color: QredColors.text.secondary }}>
                  Skip for Now
                </ButtonText>
              </Button>
            </VStack>

            {/* Additional Info */}
            <Box className="mt-4">
              <Text size="xs" className="text-typography-400 text-center leading-5">
                By completing your profile, you agree to our Terms of Service and Privacy Policy.
                You can update your information anytime from the Profile tab.
              </Text>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
