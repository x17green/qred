import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { UserRole } from "@/lib/types/database";
import { Check, DollarSign, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Alert } from "react-native";

interface RoleSelectionScreenProps {
  navigation?: any;
}

interface RoleOptionProps {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isSelected: boolean;
  onSelect: (role: UserRole) => void;
}

function RoleOption({ role, title, description, icon, isSelected, onSelect }: RoleOptionProps) {
  return (
    <Pressable
      onPress={() => onSelect(role)}
      className={`
        p-6 rounded-2xl border-2 transition-all
        ${isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-background-300 bg-background-0 data-[hover=true]:border-primary-200 data-[hover=true]:bg-primary-25'
        }
      `}
    >
      <VStack space="md">
        <HStack space="md" className="items-center">
          <Box
            className={`
              w-12 h-12 rounded-full items-center justify-center
              ${isSelected ? 'bg-primary-500' : 'bg-background-200'}
            `}
          >
            <Icon
              as={icon}
              size="lg"
              className={isSelected ? 'text-white' : 'text-typography-600'}
            />
          </Box>

          <VStack space="xs" className="flex-1">
            <Text
              size="lg"
              bold
              className={`
                ${isSelected ? 'text-primary-700' : 'text-typography-900'}
              `}
            >
              {title}
            </Text>
          </VStack>

          {isSelected && (
            <Box className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center">
              <Icon
                as={Check}
                size="sm"
                className="text-white"
              />
            </Box>
          )}
        </HStack>

        <Text
          size="sm"
          className={`
            ${isSelected ? 'text-primary-600' : 'text-typography-600'}
          `}
        >
          {description}
        </Text>
      </VStack>
    </Pressable>
  );
}

export default function RoleSelectionScreen({ navigation }: RoleSelectionScreenProps) {
  const { user, isLoading } = useAuth();
  const { updateProfile, setLoading } = useAuthActions();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    {
      role: 'LENDER' as UserRole,
      title: 'Manage My Lending',
      description: 'Choose this if you primarily lend money to others. Track who owes you, manage repayments, and get a clear view of your lending business.',
      icon: DollarSign,
    },
    {
      role: 'BORROWER' as UserRole,
      title: 'Track My Debts',
      description: 'Choose this if you primarily need to track debts you owe. See all your balances in one place, set payment reminders, and manage your repayments easily.',
      icon: Users,
    },
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Please select a role", "Choose how you'll primarily use Qred to continue.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Authentication error. Please try logging in again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);

      await updateProfile({
        defaultRole: selectedRole,
        hasCompletedRoleSelection: true,
      });

      // Navigation will be handled by auth state change
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save your selection. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Role Selection",
      "You can change your preferred view anytime from Settings. Continue with the default Borrower view?",
      [
        {
          text: "Select Role",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: async () => {
            try {
              setLoading(true);
              await updateProfile({
                defaultRole: 'BORROWER',
                hasCompletedRoleSelection: true,
              });
            } catch (error) {
              console.error("Skip role selection error:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Box className="flex-1 bg-background-0">
      <VStack space="xl" className="px-6 py-8 pt-16 flex-1">
        {/* Header */}
        <VStack space="md" className="items-center">
          <Heading size="2xl" className="text-center text-typography-900">
            How will you primarily use Qred?
          </Heading>
          <Text size="md" className="text-center text-typography-600">
            This helps us personalize your experience. You can always switch modes later.
          </Text>
        </VStack>

        {/* Role Options */}
        <VStack space="lg" className="flex-1">
          {roleOptions.map((option) => (
            <RoleOption
              key={option.role}
              role={option.role}
              title={option.title}
              description={option.description}
              icon={option.icon}
              isSelected={selectedRole === option.role}
              onSelect={setSelectedRole}
            />
          ))}
        </VStack>

        {/* Action Buttons */}
        <VStack space="md">
          <Button
            size="lg"
            className="w-full bg-primary-600"
            onPress={handleRoleSelection}
            isDisabled={!selectedRole || isSubmitting || isLoading}
          >
            <ButtonText className="text-white font-semibold">
              {isSubmitting ? "Saving Selection..." : "Continue"}
            </ButtonText>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-background-300"
            onPress={handleSkip}
            isDisabled={isSubmitting || isLoading}
          >
            <ButtonText className="text-typography-700">
              Skip for Now
            </ButtonText>
          </Button>
        </VStack>

        {/* Footer */}
        <Box className="mt-4">
          <Text size="xs" className="text-typography-400 text-center leading-5">
            Your selection helps us show you the most relevant features first.
            You can always access all features and switch between views in Settings.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
