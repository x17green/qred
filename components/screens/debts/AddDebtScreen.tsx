import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { authService } from "@/lib/services/authService";
import { useDebtActions } from "@/lib/store/debtStore";
import { CreateDebtRequest } from "@/lib/types/database";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Alert, ScrollView } from "react-native";

interface AddDebtScreenProps {
  navigation: any;
}

interface DebtFormData {
  debtorPhoneNumber: string;
  principal: string;
  interestRate: string;
  dueDate: Date;
  notes: string;
  isExternal: boolean;
  externalLenderName: string;
}

export default function AddDebtScreen({ navigation }: AddDebtScreenProps) {
  const { createDebt } = useDebtActions();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DebtFormData>({
    debtorPhoneNumber: "",
    principal: "",
    interestRate: "0",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
    notes: "",
    isExternal: false,
    externalLenderName: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate phone number
    if (!formData.debtorPhoneNumber.trim()) {
      newErrors.debtorPhoneNumber = "Debtor phone number is required";
    } else if (!authService.validatePhoneNumber(formData.debtorPhoneNumber)) {
      newErrors.debtorPhoneNumber = "Please enter a valid Nigerian phone number";
    }

    // Validate principal amount
    if (!formData.principal.trim()) {
      newErrors.principal = "Principal amount is required";
    } else {
      const amount = parseFloat(formData.principal);
      if (isNaN(amount) || amount <= 0) {
        newErrors.principal = "Principal amount must be a positive number";
      } else if (amount > 10000000) { // 10 million limit
        newErrors.principal = "Principal amount cannot exceed ₦10,000,000";
      }
    }

    // Validate interest rate
    if (formData.interestRate.trim()) {
      const rate = parseFloat(formData.interestRate);
      if (isNaN(rate) || rate < 0) {
        newErrors.interestRate = "Interest rate must be 0 or positive";
      } else if (rate > 100) {
        newErrors.interestRate = "Interest rate cannot exceed 100%";
      }
    }

    // Validate due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.dueDate < today) {
      newErrors.dueDate = "Due date cannot be in the past";
    }

    // Validate external lender name if external debt
    if (formData.isExternal && !formData.externalLenderName.trim()) {
      newErrors.externalLenderName = "External lender name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const principal = parseFloat(formData.principal);
      const interestRate = parseFloat(formData.interestRate) || 0;

      const formattedPhone = authService.formatPhoneNumber(formData.debtorPhoneNumber);

      const createRequest: CreateDebtRequest = {
        debtorPhoneNumber: formattedPhone,
        principal,
        interestRate,
        dueDate: formData.dueDate.toISOString(),
        notes: formData.notes.trim() || undefined,
        isExternal: formData.isExternal,
        externalLenderName: formData.isExternal ? formData.externalLenderName.trim() : undefined,
      };

      const newDebt = await createDebt(createRequest);

      Alert.alert(
        "Debt Created",
        "The debt has been successfully created and added to your records.",
        [
          {
            text: "View Details",
            onPress: () => {
              navigation.replace("DebtDetail", { debtId: newDebt.id });
            },
          },
          {
            text: "Add Another",
            onPress: () => {
              // Reset form
              setFormData({
                debtorPhoneNumber: "",
                principal: "",
                interestRate: "0",
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: "",
                isExternal: false,
                externalLenderName: "",
              });
              setErrors({});
            },
          },
          {
            text: "Go Back",
            style: "cancel",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create debt. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, createDebt, navigation]);

  const updateField = useCallback((field: keyof DebtFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const handleDatePress = () => {
    // For simplicity, we'll use a basic date picker
    // In a real app, you might want to use a proper date picker library
    Alert.alert(
      "Select Due Date",
      "Choose when this debt is due",
      [
        {
          text: "1 Week",
          onPress: () => updateField("dueDate", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        },
        {
          text: "2 Weeks",
          onPress: () => updateField("dueDate", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
        },
        {
          text: "1 Month",
          onPress: () => updateField("dueDate", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        },
        {
          text: "3 Months",
          onPress: () => updateField("dueDate", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const calculateTotal = (): number => {
    const principal = parseFloat(formData.principal) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const interest = (principal * rate) / 100;
    return principal + interest;
  };

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box className="px-6 py-4 pt-16 bg-background-0 border-b border-background-200">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
            <VStack className="ml-4">
              <Text size="xl" className="font-bold text-typography-900">
                Add New Debt
              </Text>
              <Text size="sm" className="text-typography-500">
                Record money you've lent
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </Box>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <VStack space="xl">
            {/* Debt Type Toggle */}
            <VStack space="md">
              <Text size="md" className="font-semibold text-typography-900">
                Debt Type
              </Text>

              <HStack space="sm">
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => updateField("isExternal", false)}
                >
                  <Box
                    className={`p-4 rounded-lg border ${
                      !formData.isExternal
                        ? "bg-primary-50 border-primary-300"
                        : "bg-background-50 border-background-300"
                    }`}
                  >
                    <VStack className="items-center">
                      <Ionicons
                        name="people"
                        size={24}
                        color={!formData.isExternal ? "#4F46E5" : "#9CA3AF"}
                      />
                      <Text
                        size="sm"
                        className={`font-medium mt-2 ${
                          !formData.isExternal ? "text-primary-700" : "text-typography-600"
                        }`}
                      >
                        Internal Debt
                      </Text>
                      <Text
                        size="xs"
                        className={
                          !formData.isExternal ? "text-primary-600" : "text-typography-500"
                        }
                      >
                        Between Qred users
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => updateField("isExternal", true)}
                >
                  <Box
                    className={`p-4 rounded-lg border ${
                      formData.isExternal
                        ? "bg-primary-50 border-primary-300"
                        : "bg-background-50 border-background-300"
                    }`}
                  >
                    <VStack className="items-center">
                      <Ionicons
                        name="business"
                        size={24}
                        color={formData.isExternal ? "#4F46E5" : "#9CA3AF"}
                      />
                      <Text
                        size="sm"
                        className={`font-medium mt-2 ${
                          formData.isExternal ? "text-primary-700" : "text-typography-600"
                        }`}
                      >
                        External Debt
                      </Text>
                      <Text
                        size="xs"
                        className={
                          formData.isExternal ? "text-primary-600" : "text-typography-500"
                        }
                      >
                        With external party
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>
              </HStack>
            </VStack>

            {/* External Lender Name (if external) */}
            {formData.isExternal && (
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Lender Name *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.externalLenderName}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Enter lender/company name"
                    value={formData.externalLenderName}
                    onChangeText={(text) => updateField("externalLenderName", text)}
                    className="text-typography-900"
                  />
                </Input>
                {errors.externalLenderName && (
                  <Text size="sm" className="text-error-600">
                    {errors.externalLenderName}
                  </Text>
                )}
              </VStack>
            )}

            {/* Debtor Phone Number */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-700">
                Debtor Phone Number *
              </Text>
              <Input
                variant="outline"
                size="lg"
                isInvalid={!!errors.debtorPhoneNumber}
                className="border-background-300"
              >
                <InputField
                  placeholder="+234 801 234 5678"
                  value={formData.debtorPhoneNumber}
                  onChangeText={(text) => updateField("debtorPhoneNumber", text)}
                  keyboardType="phone-pad"
                  className="text-typography-900"
                />
              </Input>
              {errors.debtorPhoneNumber && (
                <Text size="sm" className="text-error-600">
                  {errors.debtorPhoneNumber}
                </Text>
              )}
              <Text size="sm" className="text-typography-500">
                Phone number of the person who owes this money
              </Text>
            </VStack>

            {/* Amount Details */}
            <VStack space="lg">
              <Text size="md" className="font-semibold text-typography-900">
                Amount Details
              </Text>

              {/* Principal Amount */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Principal Amount *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.principal}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="0.00"
                    value={formData.principal}
                    onChangeText={(text) => updateField("principal", text)}
                    keyboardType="numeric"
                    className="text-typography-900"
                  />
                </Input>
                {errors.principal && (
                  <Text size="sm" className="text-error-600">
                    {errors.principal}
                  </Text>
                )}
              </VStack>

              {/* Interest Rate */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Interest Rate (% per year)
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.interestRate}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="0"
                    value={formData.interestRate}
                    onChangeText={(text) => updateField("interestRate", text)}
                    keyboardType="numeric"
                    className="text-typography-900"
                  />
                </Input>
                {errors.interestRate && (
                  <Text size="sm" className="text-error-600">
                    {errors.interestRate}
                  </Text>
                )}
                <Text size="sm" className="text-typography-500">
                  Leave as 0 for no interest
                </Text>
              </VStack>

              {/* Total Amount Display */}
              {parseFloat(formData.principal) > 0 && (
                <Box className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                  <VStack space="sm">
                    <HStack className="justify-between">
                      <Text size="sm" className="text-primary-700">
                        Principal Amount:
                      </Text>
                      <Text size="sm" className="font-medium text-primary-900">
                        ₦{parseFloat(formData.principal).toLocaleString()}
                      </Text>
                    </HStack>

                    {parseFloat(formData.interestRate) > 0 && (
                      <HStack className="justify-between">
                        <Text size="sm" className="text-primary-700">
                          Interest ({formData.interestRate}%):
                        </Text>
                        <Text size="sm" className="font-medium text-primary-900">
                          ₦{((parseFloat(formData.principal) * parseFloat(formData.interestRate)) / 100).toLocaleString()}
                        </Text>
                      </HStack>
                    )}

                    <Box className="border-t border-primary-300 pt-2">
                      <HStack className="justify-between">
                        <Text size="md" className="font-semibold text-primary-800">
                          Total Amount:
                        </Text>
                        <Text size="md" className="font-bold text-primary-900">
                          ₦{calculateTotal().toLocaleString()}
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>
              )}
            </VStack>

            {/* Due Date */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-700">
                Due Date *
              </Text>
              <Pressable onPress={handleDatePress}>
                <Box className="p-4 rounded-lg border border-background-300 bg-background-0">
                  <HStack className="items-center justify-between">
                    <Text size="md" className="text-typography-900">
                      {formatDateForDisplay(formData.dueDate)}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#9CA3AF" />
                  </HStack>
                </Box>
              </Pressable>
              {errors.dueDate && (
                <Text size="sm" className="text-error-600">
                  {errors.dueDate}
                </Text>
              )}
            </VStack>

            {/* Notes */}
            <VStack space="sm">
              <Text size="md" className="font-medium text-typography-700">
                Notes (Optional)
              </Text>
              <Input
                variant="outline"
                size="lg"
                className="border-background-300"
              >
                <InputField
                  placeholder="Add any additional notes or context..."
                  value={formData.notes}
                  onChangeText={(text) => updateField("notes", text)}
                  multiline
                  numberOfLines={3}
                  className="text-typography-900"
                  style={{ minHeight: 80 }}
                />
              </Input>
              <Text size="sm" className="text-typography-500">
                Optional details about the debt arrangement
              </Text>
            </VStack>

            {/* Submit Button */}
            <Box className="pt-4">
              <Button
                size="lg"
                className="w-full bg-primary-600"
                onPress={handleSubmit}
                isDisabled={isLoading}
              >
                <ButtonText className="text-white font-semibold">
                  {isLoading ? "Creating Debt..." : "Create Debt"}
                </ButtonText>
              </Button>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
