import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { debtService } from "@/lib/services/debtService";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts } from "@/lib/store/debtStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";

interface RecordPaymentScreenProps {
  navigation: any;
  route: {
    params: {
      debtId: string;
    };
  };
}

interface PaymentFormData {
  amount: string;
  notes: string;
}

export default function RecordPaymentScreen({ navigation, route }: RecordPaymentScreenProps) {
  const { debtId } = route.params;
  const { user } = useAuth();
  const { currentDebt, isLoading } = useDebts();
  const { fetchDebtById } = useDebtActions();

  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: "",
    notes: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const loadDebtDetails = useCallback(async () => {
    try {
      await fetchDebtById(debtId);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load debt details"
      );
    }
  }, [debtId, fetchDebtById]);

  useEffect(() => {
    loadDebtDetails();
  }, [loadDebtDetails]);

  const isLender = currentDebt?.lenderId === user?.id;
  const canRecordPayment = currentDebt?.status === "PENDING" && isLender;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate amount
    if (!formData.amount.trim()) {
      newErrors.amount = "Payment amount is required";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Payment amount must be positive";
      } else if (currentDebt && amount > currentDebt.outstandingBalance) {
        newErrors.amount = "Payment cannot exceed outstanding balance";
      } else if (amount > 10000000) { // 10 million limit
        newErrors.amount = "Payment amount cannot exceed ₦10,000,000";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRecordPayment = useCallback(async () => {
    if (!validateForm() || !currentDebt) {
      return;
    }

    try {
      setIsRecording(true);

      const amount = parseFloat(formData.amount);
      const notes = formData.notes.trim() || undefined;

      await debtService.recordPayment(debtId, amount, notes);

      // Refresh debt data
      await loadDebtDetails();

      const remainingBalance = currentDebt.outstandingBalance - amount;

      Alert.alert(
        "Payment Recorded",
        `Payment of ₦${amount.toLocaleString()} has been recorded successfully.\n\n` +
        `${remainingBalance <= 0
          ? "🎉 This debt is now fully paid!"
          : `Remaining balance: ₦${remainingBalance.toLocaleString()}`
        }`,
        [
          {
            text: "Record Another",
            onPress: () => {
              // Reset form for another payment
              setFormData({ amount: "", notes: "" });
              setErrors({});
            },
          },
          {
            text: "View Debt",
            style: "default",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setIsRecording(false);
    }
  }, [formData, currentDebt, debtId, loadDebtDetails, navigation]);

  const updateField = useCallback((field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const setQuickAmount = useCallback((percentage: number) => {
    if (currentDebt) {
      const amount = (currentDebt.outstandingBalance * percentage / 100).toString();
      updateField("amount", amount);
    }
  }, [currentDebt, updateField]);

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
        <Button
          className="mt-6 bg-primary-600"
          onPress={() => navigation.goBack()}
        >
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    );
  }

  if (!canRecordPayment) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center px-6">
        <Ionicons name="lock-closed" size={48} color="#EF4444" />
        <Text size="lg" className="font-medium text-typography-900 mt-4">
          Cannot Record Payment
        </Text>
        <Text size="sm" className="text-typography-500 mt-2 text-center">
          {!isLender
            ? "Only the lender can record payments for this debt."
            : currentDebt.status === "PAID"
            ? "This debt has already been paid in full."
            : "Payments can only be recorded for pending debts."
          }
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

  const debtorName = debtService.getDebtorDisplayName(currentDebt);

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box className="px-6 py-4 pt-16 bg-background-0 border-b border-background-200">
        <HStack className="items-center">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <VStack className="ml-4 flex-1">
            <Text size="xl" className="font-bold text-typography-900">
              Record Payment
            </Text>
            <Text size="sm" className="text-typography-500">
              Payment from {debtorName}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <VStack space="xl">
            {/* Debt Summary */}
            <Box className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <Text size="sm" className="text-primary-700 font-medium">
                    Current Outstanding Balance
                  </Text>
                  <Text size="lg" className="font-bold text-primary-900">
                    {debtService.formatCurrency(currentDebt.outstandingBalance)}
                  </Text>
                </HStack>

                <HStack className="items-center justify-between">
                  <Text size="xs" className="text-primary-600">
                    Original Amount:
                  </Text>
                  <Text size="xs" className="text-primary-700">
                    {debtService.formatCurrency(currentDebt.totalAmount)}
                  </Text>
                </HStack>

                {currentDebt.totalAmount > currentDebt.outstandingBalance && (
                  <HStack className="items-center justify-between">
                    <Text size="xs" className="text-primary-600">
                      Already Paid:
                    </Text>
                    <Text size="xs" className="text-success-600 font-medium">
                      {debtService.formatCurrency(currentDebt.totalAmount - currentDebt.outstandingBalance)}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Quick Amount Buttons */}
            <VStack space="md">
              <Text size="md" className="font-semibold text-typography-900">
                Quick Amounts
              </Text>

              <HStack space="md">
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(25)}
                >
                  <Box className="p-3 bg-background-50 rounded-lg border border-background-300">
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium text-typography-700">
                        25%
                      </Text>
                      <Text size="xs" className="text-typography-500">
                        ₦{(currentDebt.outstandingBalance * 0.25).toLocaleString()}
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(50)}
                >
                  <Box className="p-3 bg-background-50 rounded-lg border border-background-300">
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium text-typography-700">
                        50%
                      </Text>
                      <Text size="xs" className="text-typography-500">
                        ₦{(currentDebt.outstandingBalance * 0.5).toLocaleString()}
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(100)}
                >
                  <Box className="p-3 bg-success-50 rounded-lg border border-success-300">
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium text-success-700">
                        Full
                      </Text>
                      <Text size="xs" className="text-success-600">
                        Pay all
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>
              </HStack>
            </VStack>

            {/* Payment Form */}
            <VStack space="lg">
              <Text size="md" className="font-semibold text-typography-900">
                Payment Details
              </Text>

              {/* Amount */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Payment Amount *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!errors.amount}
                  className="border-background-300"
                >
                  <InputField
                    placeholder="0.00"
                    value={formData.amount}
                    onChangeText={(text) => updateField("amount", text)}
                    keyboardType="numeric"
                    className="text-typography-900"
                  />
                </Input>
                {errors.amount && (
                  <Text size="sm" className="text-error-600">
                    {errors.amount}
                  </Text>
                )}
                <Text size="sm" className="text-typography-500">
                  Maximum: ₦{currentDebt.outstandingBalance.toLocaleString()}
                </Text>
              </VStack>

              {/* Notes */}
              <VStack space="sm">
                <Text size="md" className="font-medium text-typography-700">
                  Payment Notes (Optional)
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  className="border-background-300"
                >
                  <InputField
                    placeholder="Add payment details (e.g., cash payment, bank transfer...)"
                    value={formData.notes}
                    onChangeText={(text) => updateField("notes", text)}
                    multiline
                    numberOfLines={3}
                    className="text-typography-900"
                    style={{ minHeight: 80 }}
                  />
                </Input>
                <Text size="sm" className="text-typography-500">
                  Optional details about how the payment was made
                </Text>
              </VStack>

              {/* Payment Preview */}
              {parseFloat(formData.amount) > 0 && (
                <Box className="bg-success-50 p-4 rounded-lg border border-success-200">
                  <VStack space="sm">
                    <HStack className="justify-between">
                      <Text size="sm" className="text-success-700">
                        Payment Amount:
                      </Text>
                      <Text size="sm" className="font-medium text-success-900">
                        ₦{parseFloat(formData.amount).toLocaleString()}
                      </Text>
                    </HStack>

                    <HStack className="justify-between">
                      <Text size="sm" className="text-success-700">
                        Remaining Balance:
                      </Text>
                      <Text size="sm" className="font-medium text-success-900">
                        ₦{Math.max(0, currentDebt.outstandingBalance - parseFloat(formData.amount)).toLocaleString()}
                      </Text>
                    </HStack>

                    {(currentDebt.outstandingBalance - parseFloat(formData.amount)) <= 0 && (
                      <Box className="border-t border-success-300 pt-2">
                        <Text size="md" className="font-bold text-success-800 text-center">
                          🎉 This payment will settle the debt in full!
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>

            {/* Action Buttons */}
            <VStack space="md" className="pt-4">
              <Button
                size="lg"
                className="w-full bg-success-600"
                onPress={handleRecordPayment}
                isDisabled={isRecording || !formData.amount.trim()}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <ButtonText className="ml-2 text-white font-semibold">
                  {isRecording ? "Recording Payment..." : "Record Payment"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-background-300"
                onPress={() => navigation.goBack()}
                isDisabled={isRecording}
              >
                <ButtonText className="text-typography-700">
                  Cancel
                </ButtonText>
              </Button>
            </VStack>

            {/* Info Box */}
            <Box className="bg-info-50 p-4 rounded-lg border border-info-200">
              <HStack className="items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <VStack className="ml-3 flex-1">
                  <Text size="sm" className="text-info-700 font-medium">
                    About Manual Payments
                  </Text>
                  <Text size="sm" className="text-info-600 mt-1">
                    Use this feature to record payments you've received outside the app (cash, bank transfer, etc.).
                    The payment will be marked as successful and the debt balance will be updated automatically.
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
