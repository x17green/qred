import React from "react";
import { Alert } from "react-native";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth, useAuthActions } from "@/lib/store/authStore";

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user } = useAuth();
  const { signOut } = useAuthActions();

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
                {user?.phoneNumber}
              </Text>
              {user?.email && (
                <Text size="sm" className="text-typography-500">
                  {user.email}
                </Text>
              )}
            </VStack>
          </VStack>

          {/* Menu Items */}
          <VStack space="md">
            <ProfileMenuItem
              title="Edit Profile"
              description="Update your personal information"
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Edit profile feature will be implemented",
                );
              }}
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
            >
              <ButtonText className="text-error-600 font-semibold">
                Sign Out
              </ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}

// Profile Menu Item Component
function ProfileMenuItem({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Box
      className="bg-background-0 p-4 rounded-lg border border-background-200 shadow-sm"
      onTouchEnd={onPress}
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1">
          <Text size="md" className="font-medium text-typography-900">
            {title}
          </Text>
          <Text size="sm" className="text-typography-500 mt-1">
            {description}
          </Text>
        </VStack>
        <Text size="lg" className="text-typography-400 ml-4">
          →
        </Text>
      </HStack>
    </Box>
  );
}
