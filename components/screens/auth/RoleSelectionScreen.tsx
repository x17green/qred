import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { UserRole } from "@/lib/types/database";
import { Check, DollarSign, TrendingUp, Users } from "lucide-react-native";
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
  const isLender = role === 'LENDER';

  return (
    <Card
      variant={isSelected ? "elevated" : "outline"}
      className={`
        overflow-hidden transition-all duration-200 border-2
        ${isSelected
          ? isLender
            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-100 shadow-emerald-100'
            : 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-100 shadow-amber-100'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      <Pressable onPress={() => onSelect(role)} className="p-0">
        <CardBody className="p-6">
          <VStack space="lg">
            <HStack space="md" className="items-center">
              <Box
                className={`
                  w-16 h-16 rounded-2xl items-center justify-center shadow-lg
                  ${isSelected
                    ? isLender
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }
                `}
              >
                <Icon
                  as={icon}
                  size="xl"
                  className={isSelected ? 'text-white' : 'text-gray-600'}
                />
              </Box>

              <VStack space="xs" className="flex-1">
                <HStack className="items-center justify-between">
                  <Heading
                    size="lg"
                    className={`
                      ${isSelected
                        ? isLender ? 'text-emerald-800' : 'text-amber-800'
                        : 'text-gray-800'
                      }
                    `}
                  >
                    {title}
                  </Heading>

                  {isSelected && (
                    <Badge
                      action={isLender ? "success" : "warning"}
                      size="sm"
                      variant="solid"
                      className="ml-2"
                    >
                      <BadgeText>Selected</BadgeText>
                    </Badge>
                  )}
                </HStack>

                {isSelected && (
                  <HStack space="xs" className="items-center">
                    <Icon as={TrendingUp} size="xs" className={isLender ? 'text-emerald-600' : 'text-amber-600'} />
                    <Text size="xs" className={isLender ? 'text-emerald-600' : 'text-amber-600'}>
                      {isLender ? 'Grow your lending business' : 'Better debt management'}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {isSelected && (
                <Box className={`w-8 h-8 rounded-full items-center justify-center ${isLender ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  <Icon
                    as={Check}
                    size="md"
                    className="text-white"
                  />
                </Box>
              )}
            </HStack>

            <Text
              size="sm"
              className={`
                leading-relaxed
                ${isSelected
                  ? isLender ? 'text-emerald-700' : 'text-amber-700'
                  : 'text-gray-600'
                }
              `}
            >
              {description}
            </Text>
          </VStack>
        </CardBody>
      </Pressable>
    </Card>
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
      description: 'Perfect for lenders and financial professionals. Track who owes you money, manage repayments, send reminders, and get comprehensive analytics on your lending portfolio.',
      icon: DollarSign,
    },
    {
      role: 'BORROWER' as UserRole,
      title: 'Track My Debts',
      description: 'Ideal for personal debt management. Keep track of all your debts in one place, set payment reminders, manage multiple lenders, and stay on top of your financial obligations.',
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
    <Box className="flex-1 bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <VStack space="xl" className="px-6 py-8 pt-16 flex-1">
        {/* Enhanced Header */}
        <Card variant="filled" className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0">
          <CardBody className="p-6">
            <VStack space="md" className="items-center">
              <Box className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-2">
                <Icon as={TrendingUp} size="xl" className="text-white" />
              </Box>

              <Heading size="2xl" className="text-center text-white">
                How will you primarily use Qred?
              </Heading>

              <Text size="md" className="text-center text-blue-100 max-w-sm">
                Choose your primary mode to get a personalized experience. Don't worry - you'll have access to all features regardless of your choice.
              </Text>
            </VStack>
          </CardBody>
        </Card>

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

        {/* Enhanced Action Buttons */}
        <VStack space="md">
          <Button
            size="lg"
            className={`
              w-full shadow-lg
              ${selectedRole === 'LENDER'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                : selectedRole === 'BORROWER'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
              }
            `}
            onPress={handleRoleSelection}
            isDisabled={!selectedRole || isSubmitting || isLoading}
          >
            <ButtonText className="text-white font-semibold text-base">
              {isSubmitting ? "Setting Up Your Experience..." : "Continue to Qred"}
            </ButtonText>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-gray-300 bg-white/80"
            onPress={handleSkip}
            isDisabled={isSubmitting || isLoading}
          >
            <ButtonText className="text-gray-700 font-medium">
              I'll Choose Later
            </ButtonText>
          </Button>
        </VStack>

        {/* Enhanced Footer */}
        <Card variant="ghost" className="mt-4">
          <CardBody className="p-4">
            <VStack space="sm">
              <HStack space="xs" className="items-center justify-center">
                <Icon as={Check} size="xs" className="text-green-600" />
                <Text size="xs" className="text-gray-600 text-center">
                  Switch between modes anytime in Settings
                </Text>
              </HStack>
              <HStack space="xs" className="items-center justify-center">
                <Icon as={Check} size="xs" className="text-green-600" />
                <Text size="xs" className="text-gray-600 text-center">
                  Access to all features regardless of your choice
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
