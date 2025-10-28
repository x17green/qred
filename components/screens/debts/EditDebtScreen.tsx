import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { authService } from "@/lib/services/authService";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts } from "@/lib/store/debtStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";

interface EditDebtScreenProps {
  navigation: any;
  route: {
    params: {
      debtId: string;
    };
  };
}

interface EditDebtFormData {
  debtorPhoneNumber: string;
  principal: string;
  interestRate: string;
  dueDate: Date;
  notes: string;
  externalLenderName: string;
}

export default function EditDebtScreen({ navigation, route }: EditDebtScreenProps) {
  const { debtId } = route.params;
  const { user } = useAuth();
  const { currentDebt, isLoading } = useDebts();
  const { fetchDebtById, updateDebtDetails } = useDebtActions();

  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<EditDebtFormData>({
    debtorPhoneNumber: "",
    principal: "",
    interestRate: "",
    dueDate: new Date(),
    notes: "",
    externalLenderName: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isLender = currentDebt?.lenderId === user?.id;

  useEffect(() => {
    const loadDebtDetails = async () => {
      try {
        await fetchDebtById(debtId);
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to load debt details"
        );
      }
    };

    loadDebtDetails();
  }, [debtId, fetchDebtById]);

  useEffect(() => {
    if (currentDebt) {
      setFormData({
        debtorPhoneNumber: currentDebt.debtorPhoneNumber,
        principal: currentDebt.principalAmount.toString(),
        interestRate: currentDebt.interestRate.toString(),
        dueDate: new Date(currentDebt.dueDate),
        notes: currentDebt.notes || "",
        externalLenderName: currentDebt.externalLenderName || "",
      });
    }
  }, [currentDebt]);

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
      } else if (amount > 10000000) {
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
    if (currentDebt?.isExternal && !formData.externalLenderName.trim()) {
      newErrors.externalLenderName = "External lender name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !currentDebt) {
      return;
    }

    try {
      setIsUpdating(true);

      const principal = parseFloat(formData.principal);
      const interestRate = parseFloat(formData.interestRate) || 0;
      const calculatedInterest = (principal * interestRate) / 100;
      const totalAmount = principal + calculatedInterest;

      const formattedPhone = authService.formatPhoneNumber(formData.debtorPhoneNumber);

      const updateData = {
        debtorPhoneNumber: formattedPhone,
        principalAmount: principal,
        interestRate,
        calculatedInterest,
        totalAmount,
        // Only update outstanding balance if debt is still pending
        ...(currentDebt.status === "PENDING" && { outstandingBalance: totalAmount }),
        dueDate: formData.dueDate.toISOString(),
        notes: formData.notes.trim() || null,
        ...(currentDebt.isExternal && { externalLenderName: formData.externalLenderName.trim() }),
      };

      await updateDebtDetails(debtId, updateData);

      Alert.alert(
        "Success",
        "Debt details have been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update debt. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  }, [formData, currentDebt, debtId, updateDebtDetails, navigation]);

  const updateField = useCallback((field: keyof EditDebtFormData, value: any) => {
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

  if (isLoading && !currentDebt) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center">
        <Text className="text-typography-500">Loading debt details...</Text>
      </Box>
    );
  }

  if (!currentDebt) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center px-6">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text size="lg" className="font-medium text-typography-900 mt-4">
          Debt Not Found
        </Text>
        <Text size="sm" className="text-typography-500 mt-2 text-center">
          The debt you're trying to edit doesn't exist or has been removed.
        </Text>
        <Button
          className="mt-6 bg-primary-600"
          onPress={() => navigation.goBack()}
        >
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    );
  }

  if (!isLender) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center px-6">
        <Ionicons name="lock-closed" size={48} color="#EF4444" />
        <Text size="lg" className="font-medium text-typography-900 mt-4">
          Access Denied
        </Text>
        <Text size="sm" className="text-typography-500 mt-2 text-center">
          Only the lender can edit debt details.
        </Text>
        <Button
          className="mt-6 bg-primary-600"
          onPress={() => navigation.goBack()}
        >
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    );
  }

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
                Edit Debt
              </Text>
              <Text size="sm" className="text-typography-500">
                Update debt details
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </Box>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <VStack space="xl">
            {/* Debt Status Info */}
            <Box className="bg-info-50 p-4 rounded-lg border border-info-200">
              <HStack className="items-center">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text size="sm" className="text-info-700 ml-2 flex-1">
                  {currentDebt.status === "PAID"
                    ? "This debt has been paid. Only notes and due date can be edited."
                    : "Editing principal amount will recalculate the total debt amount."
                  }
                </Text>
              </HStack>
            </Box>

            {/* External Lender Name (if external) */}
            {currentDebt.isExternal && (
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
                  isDisabled={currentDebt.status === "PAID"}
                >
                  <InputField
                    placeholder="0.00"
                    value={formData.principal}
                    onChangeText={(text) => updateField("principal", text)}
                    keyboardType="numeric"
                    className="text-typography-900"
                    editable={currentDebt.status !== "PAID"}
                  />
                </Input>
                {errors.principal && (
                  <Text size="sm" className="text-error-600">
                    {errors.principal}
                  </Text>
                )}
                {currentDebt.status === "PAID" && (
                  <Text size="sm" className="text-typography-500">
                    Cannot edit amount for paid debts
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
                  isDisabled={currentDebt.status === "PAID"}
                >
                  <InputField
                    placeholder="0"
                    value={formData.interestRate}
                    onChangeText={(text) => updateField("interestRate", text)}
                    keyboardType="numeric"
                    className="text-typography-900"
                    editable={currentDebt.status !== "PAID"}
                  />
                </Input>
                {errors.interestRate && (
                  <Text size="sm" className="text-error-600">
                    {errors.interestRate}
                  </Text>
                )}
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

                    {currentDebt.status === "PENDING" && calculateTotal() !== currentDebt.totalAmount && (
                      <Text size="xs" className="text-primary-600 mt-2">
                        Outstanding balance will be updated to match the new total
                      </Text>
                    )}
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
            </VStack>

            {/* Action Buttons */}
            <VStack space="md" className="pt-4">
              <Button
                size="lg"
                className="w-full bg-primary-600"
                onPress={handleSubmit}
                isDisabled={isUpdating}
              >
                <ButtonText className="text-white font-semibold">
                  {isUpdating ? "Updating..." : "Update Debt"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-background-300"
                onPress={() => navigation.goBack()}
                isDisabled={isUpdating}
              >
                <ButtonText className="text-typography-700">
                  Cancel
                </ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
