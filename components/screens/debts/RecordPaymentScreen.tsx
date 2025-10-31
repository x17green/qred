import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { BorderRadius, QredColors, Shadows } from "@/lib/constants/colors";
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
    <Box className="flex-1" style={{ backgroundColor: QredColors.background.light }}>
      {/* Header */}
      <Box className="px-6 py-4 pt-16 border-b" style={{ backgroundColor: QredColors.background.light, borderColor: QredColors.border.light }}>
        <HStack className="items-center">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={QredColors.text.secondary} />
          </Pressable>
          <VStack className="ml-4 flex-1">
            <Text size="xl" className="-mb-3 font-bold" style={{ color: QredColors.text.primary }}>
              Record Payment
            </Text>
            <Text size="sm" className="mt-1" style={{ color: QredColors.text.secondary }}>
              Payment from {debtorName}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <VStack space="xl">
            {/* Debt Summary */}
            <Box className="p-4 border" style={{ backgroundColor: QredColors.brand.navyLight + '20', borderColor: QredColors.border.dark, borderRadius: BorderRadius.md }}>
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <Text size="sm" className="font-medium" style={{ color: QredColors.brand.navy }}>
                    Current Outstanding Balance
                  </Text>
                  <Text size="lg" className="font-bold" style={{ color: QredColors.brand.navyDark }}>
                    {debtService.formatCurrency(currentDebt.outstandingBalance)}
                  </Text>
                </HStack>

                <HStack className="items-center justify-between">
                  <Text size="xs" style={{ color: QredColors.brand.navy }}>
                    Original Amount:
                  </Text>
                  <Text size="xs" style={{ color: QredColors.brand.navy }}>
                    {debtService.formatCurrency(currentDebt.totalAmount)}
                  </Text>
                </HStack>

                {currentDebt.totalAmount > currentDebt.outstandingBalance && (
                  <HStack className="items-center justify-between">
                    <Text size="xs" style={{ color: QredColors.brand.navy }}>
                      Already Paid:
                    </Text>
                    <Text size="xs" className="font-medium" style={{ color: QredColors.status.success[600] }}>
                      {debtService.formatCurrency(currentDebt.totalAmount - currentDebt.outstandingBalance)}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Quick Amount Buttons */}
            <VStack space="sm">
              <Text size="md" className="font-semibold text-typography-900">
                Quick Amounts
              </Text>

              <HStack space="xs">
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(25)}
                >
                  <Box className="p-3 border" style={{ backgroundColor: QredColors.background.muted, borderColor: QredColors.border.light, borderRadius: BorderRadius.md }}>
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium" style={{ color: QredColors.text.primary }}>
                        25%
                      </Text>
                      <Text size="xs" style={{ color: QredColors.text.secondary }}>
                        ₦{(currentDebt.outstandingBalance * 0.25).toLocaleString()}
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(50)}
                >
                  <Box className="p-3 border" style={{ backgroundColor: QredColors.background.muted, borderColor: QredColors.border.light, borderRadius: BorderRadius.md }}>
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium" style={{ color: QredColors.text.primary }}>
                        50%
                      </Text>
                      <Text size="xs" style={{ color: QredColors.text.secondary }}>
                        ₦{(currentDebt.outstandingBalance * 0.5).toLocaleString()}
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setQuickAmount(100)}
                >
                  <Box className="p-3 border" style={{ backgroundColor: QredColors.status.success[50], borderColor: QredColors.status.success[200], borderRadius: BorderRadius.md }}>
                    <VStack className="items-center">
                      <Text size="sm" className="font-medium" style={{ color: QredColors.status.success[700] }}>
                        Full
                      </Text>
                      <Text size="xs" style={{ color: QredColors.status.success[600] }}>
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
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.amount ? QredColors.status.error[500] : QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <InputField
                    placeholder="0.00"
                    value={formData.amount}
                    onChangeText={(text) => updateField("amount", text)}
                    keyboardType="numeric"
                    style={{ color: QredColors.text.primary }}
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
                  style={{
                    borderWidth: 1.5,
                    borderColor: QredColors.border.light,
                    backgroundColor: QredColors.background.elevated,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <InputField
                    placeholder="Add payment details (e.g., cash payment, bank transfer...)"
                    value={formData.notes}
                    onChangeText={(text) => updateField("notes", text)}
                    multiline
                    numberOfLines={3}
                    style={{ color: QredColors.text.primary, minHeight: 80 }}
                  />
                </Input>
                <Text size="sm" className="text-typography-500">
                  Optional details about how the payment was made
                </Text>
              </VStack>

              {/* Payment Preview */}
              {parseFloat(formData.amount) > 0 && (
                <Box className="p-4 border" style={{ backgroundColor: QredColors.status.success[50], borderColor: QredColors.status.success[200], borderRadius: BorderRadius.md }}>
                  <VStack space="sm">
                    <HStack className="justify-between">
                      <Text size="sm" style={{ color: QredColors.status.success[700] }}>
                        Payment Amount:
                      </Text>
                      <Text size="sm" className="font-medium" style={{ color: QredColors.status.success[900] }}>
                        ₦{parseFloat(formData.amount).toLocaleString()}
                      </Text>
                    </HStack>

                    <HStack className="justify-between">
                      <Text size="sm" style={{ color: QredColors.status.success[700] }}>
                        Remaining Balance:
                      </Text>
                      <Text size="sm" className="font-medium" style={{ color: QredColors.status.success[900] }}>
                        ₦{Math.max(0, currentDebt.outstandingBalance - parseFloat(formData.amount)).toLocaleString()}
                      </Text>
                    </HStack>

                    {(currentDebt.outstandingBalance - parseFloat(formData.amount)) <= 0 && (
                      <Box className="pt-2" style={{ borderTopWidth: 1, borderTopColor: QredColors.status.success[200] }}>
                        <Text size="md" className="font-bold text-center" style={{ color: QredColors.status.success[800] }}>
                          🎉 This payment will settle the debt in full!
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>

            {/* Action Buttons */}
            <VStack space="sm" className="pt-4">
              <Button
                size="lg"
                className="w-full"
                onPress={handleRecordPayment}
                isDisabled={isRecording || !formData.amount.trim()}
                style={{
                  backgroundColor: QredColors.status.success[600],
                  borderRadius: BorderRadius.lg,
                  height: 40,
                  ...Shadows.md,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={QredColors.text.inverse} />
                <ButtonText className="ml-2 font-semibold" style={{ color: QredColors.text.inverse }}>
                  {isRecording ? "Recording Payment..." : "Record Payment"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onPress={() => navigation.goBack()}
                isDisabled={isRecording}
                style={{
                  borderColor: QredColors.border.medium,
                  backgroundColor: QredColors.background.muted,
                  borderRadius: BorderRadius.lg,
                }}
              >
                <ButtonText style={{ color: QredColors.text.secondary }}>
                  Cancel
                </ButtonText>
              </Button>
            </VStack>

            {/* Info Box */}
            <Box className="p-4 border" style={{ backgroundColor: QredColors.status.info[50], borderColor: QredColors.status.info[200], borderRadius: BorderRadius.md }}>
              <HStack className="items-start">
                <Ionicons name="information-circle" size={20} color={QredColors.status.info[600]} />
                <VStack className="ml-3 flex-1">
                  <Text size="sm" className="font-medium" style={{ color: QredColors.status.info[700] }}>
                    About Manual Payments
                  </Text>
                  <Text size="sm" className="mt-1" style={{ color: QredColors.status.info[600] }}>
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
