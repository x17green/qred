import React, { useState, useEffect } from "react";
import { Alert, ScrollView } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { authService } from "@/lib/services/authService";

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isLoading } = useAuth();
  const { signOut, updateProfile } = useAuthActions();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize edit data when user data loads
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate name
    if (!editData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate email
    if (!editData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!authService.validateEmail(editData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone number (optional but if provided, must be valid)
    if (
      editData.phoneNumber.trim() &&
      !authService.validatePhoneNumber(editData.phoneNumber)
    ) {
      newErrors.phoneNumber = "Please enter a valid Nigerian phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);

      const formattedPhone = editData.phoneNumber.trim()
        ? authService.formatPhoneNumber(editData.phoneNumber)
        : null;

      await updateProfile({
        name: editData.name.trim(),
        email: editData.email.trim(),
        phoneNumber: formattedPhone,
      });

      setIsEditing(false);
      Alert.alert("Success", "Your profile has been updated successfully.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

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
            await signOut();
            // Navigation will be handled by auth state change
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to sign out",
            );
          }
        },
      },
    ]);
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView className="flex-1">
        <Box className="flex-1 px-6 py-4 pt-16">
          <VStack space="xl">
            {/* Header */}
            <VStack space="md" className="items-center py-8">
              <Box className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center">
                <Text size="2xl" className="font-bold text-primary-600">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </Box>
              <VStack space="sm" className="items-center">
                <Text size="xl" className="font-bold text-typography-900">
                  {user?.name || "User"}
                </Text>
                <Text size="sm" className="text-typography-500">
                  {user?.phoneNumber || "No phone number"}
                </Text>
                <Text size="sm" className="text-typography-500">
                  {user?.email || "No email address"}
                </Text>
              </VStack>
            </VStack>

            {/* Profile Edit Form */}
            {isEditing ? (
              <VStack space="lg" className="bg-background-50 p-4 rounded-lg">
                <Text size="lg" className="font-semibold text-typography-900">
                  Edit Profile
                </Text>

                {/* Name Input */}
                <VStack space="sm">
                  <Text size="sm" className="font-medium text-typography-700">
                    Full Name *
                  </Text>
                  <Input
                    variant="outline"
                    size="md"
                    isInvalid={!!errors.name}
                    className="border-background-300"
                  >
                    <InputField
                      placeholder="Enter your full name"
                      value={editData.name}
                      onChangeText={(text) =>
                        setEditData({ ...editData, name: text })
                      }
                      className="text-typography-900"
                    />
                  </Input>
                  {errors.name && (
                    <Text size="sm" className="text-error-600">
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
                    size="md"
                    isInvalid={!!errors.email}
                    className="border-background-300"
                  >
                    <InputField
                      placeholder="Enter your email address"
                      value={editData.email}
                      onChangeText={(text) =>
                        setEditData({ ...editData, email: text })
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="text-typography-900"
                    />
                  </Input>
                  {errors.email && (
                    <Text size="sm" className="text-error-600">
                      {errors.email}
                    </Text>
                  )}
                </VStack>

                {/* Phone Input */}
                <VStack space="sm">
                  <Text size="sm" className="font-medium text-typography-700">
                    Phone Number
                  </Text>
                  <Input
                    variant="outline"
                    size="md"
                    isInvalid={!!errors.phoneNumber}
                    className="border-background-300"
                  >
                    <InputField
                      placeholder="Enter your phone number"
                      value={editData.phoneNumber}
                      onChangeText={(text) =>
                        setEditData({ ...editData, phoneNumber: text })
                      }
                      keyboardType="phone-pad"
                      className="text-typography-900"
                    />
                  </Input>
                  {errors.phoneNumber && (
                    <Text size="sm" className="text-error-600">
                      {errors.phoneNumber}
                    </Text>
                  )}
                </VStack>

                {/* Edit Actions */}
                <HStack space="md" className="mt-4">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1 border-background-300"
                    onPress={handleCancelEdit}
                    isDisabled={isUpdating}
                  >
                    <ButtonText className="text-typography-700">
                      Cancel
                    </ButtonText>
                  </Button>
                  <Button
                    size="md"
                    className="flex-1 bg-primary-600"
                    onPress={handleSaveProfile}
                    isDisabled={isUpdating}
                  >
                    <ButtonText className="text-white">
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </ButtonText>
                  </Button>
                </HStack>
              </VStack>
            ) : null}

            {/* Menu Items */}
            <VStack space="md">
              <ProfileMenuItem
                title="Edit Profile"
                description="Update your personal information"
                onPress={() => setIsEditing(true)}
                disabled={isEditing}
              />

              <ProfileMenuItem
                title="Security Settings"
                description="Manage your account security"
                onPress={() => {
                  Alert.alert(
                    "Coming Soon",
                    "Security settings will be implemented",
                  );
                }}
              />

              <ProfileMenuItem
                title="Notifications"
                description="Configure notification preferences"
                onPress={() => {
                  Alert.alert(
                    "Coming Soon",
                    "Notification settings will be implemented",
                  );
                }}
              />

              <ProfileMenuItem
                title="Export Data"
                description="Download your debt records"
                onPress={() => {
                  Alert.alert(
                    "Coming Soon",
                    "Data export feature will be implemented",
                  );
                }}
              />

              <ProfileMenuItem
                title="Help & Support"
                description="Get help or contact support"
                onPress={() => {
                  Alert.alert(
                    "Coming Soon",
                    "Help & support section will be implemented",
                  );
                }}
              />

              <ProfileMenuItem
                title="About"
                description="App version and information"
                onPress={() => {
                  Alert.alert(
                    "About",
                    "Qred v1.0.0\nYour credit, simplified\n\nA modern debt management application",
                  );
                }}
              />
            </VStack>

            {/* Sign Out Button */}
            <Box className="mt-8">
              <Button
                variant="outline"
                action="negative"
                size="lg"
                className="w-full border-error-300"
                onPress={handleSignOut}
                isDisabled={isLoading || isUpdating}
              >
                <ButtonText className="text-error-600 font-semibold">
                  {isLoading ? "Signing Out..." : "Sign Out"}
                </ButtonText>
              </Button>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}

// Profile Menu Item Component
function ProfileMenuItem({
  title,
  description,
  onPress,
  disabled = false,
}: {
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Box
      className={`bg-background-0 p-4 rounded-lg border border-background-200 shadow-sm ${
        disabled ? "opacity-50" : ""
      }`}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1">
          <Text
            size="md"
            className={`font-medium ${disabled ? "text-typography-400" : "text-typography-900"}`}
          >
            {title}
          </Text>
          <Text size="sm" className="text-typography-500 mt-1">
            {description}
          </Text>
        </VStack>
        <Text
          size="lg"
          className={`ml-4 ${disabled ? "text-typography-300" : "text-typography-400"}`}
        >
          →
        </Text>
      </HStack>
    </Box>
  );
}
