import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { debtService } from "@/lib/services/debtService";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts } from "@/lib/store/debtStore";
import { PaymentRow } from "@/lib/types/database";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, RefreshControl, ScrollView } from "react-native";

interface DebtDetailScreenProps {
  navigation: any;
  route: {
    params: {
      debtId: string;
    };
  };
}

export default function DebtDetailScreen({ navigation, route }: DebtDetailScreenProps) {
  const { debtId } = route.params;
  const { user } = useAuth();
  const { currentDebt, isLoading } = useDebts();
  const {
    fetchDebtById,
    markDebtAsPaid,
    deleteDebt,
    initializePayment,
    sendPaymentReminder
  } = useDebtActions();

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRow[]>([]);

  const loadDebtDetails = useCallback(async () => {
    try {
      await fetchDebtById(debtId);
      // Load payment history
      const payments = await debtService.getPaymentHistory(debtId);
      setPaymentHistory(payments);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDebtDetails();
    } finally {
      setRefreshing(false);
    }
  }, [loadDebtDetails]);

  const isLender = useMemo(() => {
    return user?.id === currentDebt?.lenderId;
  }, [user?.id, currentDebt?.lenderId]);

  const isOverdue = useMemo(() => {
    if (!currentDebt) return false;
    return currentDebt.status === "PENDING" && new Date(currentDebt.dueDate) < new Date();
  }, [currentDebt]);

  const daysUntilDue = useMemo(() => {
    if (!currentDebt) return 0;
    return debtService.getDaysUntilDue(currentDebt.dueDate);
  }, [currentDebt]);

  const handleMarkAsPaid = useCallback(async () => {
    if (!currentDebt) return;

    Alert.alert(
      "Mark as Paid",
      "Are you sure you want to mark this debt as fully paid?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as Paid",
          style: "default",
          onPress: async () => {
            try {
              setActionLoading("markPaid");
              await markDebtAsPaid(debtId);
              Alert.alert(
                "Success",
                "Debt has been marked as paid successfully."
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to mark debt as paid"
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [currentDebt, debtId, markDebtAsPaid]);

  const handleDeleteDebt = useCallback(async () => {
    if (!currentDebt) return;

    Alert.alert(
      "Delete Debt",
      "Are you sure you want to delete this debt? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("delete");
              await deleteDebt(debtId);
              Alert.alert("Success", "Debt has been deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete debt"
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [currentDebt, debtId, deleteDebt, navigation]);

  const handlePaymentReminder = useCallback(async () => {
    if (!currentDebt) return;

    try {
      setActionLoading("reminder");
      await sendPaymentReminder(debtId);
      Alert.alert(
        "Reminder Sent",
        "Payment reminder has been sent to the debtor."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send reminder"
      );
    } finally {
      setActionLoading(null);
    }
  }, [currentDebt, debtId, sendPaymentReminder]);

  const handleMakePayment = useCallback(async () => {
    if (!currentDebt || !user) return;

    Alert.alert(
      "Make Payment",
      `Pay ₦${currentDebt.outstandingBalance.toLocaleString()} for this debt?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Pay Now",
          onPress: async () => {
            try {
              setActionLoading("payment");
              const paymentResponse = await initializePayment(
                debtId,
                currentDebt.outstandingBalance,
                user.email || ""
              );

              if (paymentResponse.authorization_url) {
                // Open payment gateway
                const supported = await Linking.canOpenURL(paymentResponse.authorization_url);
                if (supported) {
                  await Linking.openURL(paymentResponse.authorization_url);
                } else {
                  Alert.alert("Error", "Cannot open payment gateway");
                }
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to initialize payment"
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [currentDebt, user, debtId, initializePayment]);

  const handleEditDebt = useCallback(() => {
    navigation.navigate("EditDebt", { debtId });
  }, [navigation, debtId]);

  const handleCallDebtor = useCallback(() => {
    if (!currentDebt) return;

    const phoneNumber = currentDebt.debtorPhoneNumber;
    Linking.openURL(`tel:${phoneNumber}`);
  }, [currentDebt]);

  const handleRecordPayment = useCallback(() => {
    navigation.navigate("RecordPayment", { debtId });
  }, [navigation, debtId]);

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
          The debt you're looking for doesn't exist or has been removed.
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

  const getPersonName = () => {
    if (isLender) {
      return debtService.getDebtorDisplayName(currentDebt);
    } else {
      return currentDebt.externalLenderName || currentDebt.lender?.name || "Unknown";
    }
  };

  const getPersonSubtitle = () => {
    if (isLender) {
      if (currentDebt.debtorName && currentDebt.debtorName.trim()) {
        return currentDebt.debtorPhoneNumber;
      }
      return currentDebt.debtor ? "Registered User" : currentDebt.debtorPhoneNumber;
    } else {
      return currentDebt.isExternal ? "External Lender" : "Qred User";
    }
  };

  const statusColor = debtService.getDebtStatusColor(currentDebt.status);

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box className="px-6 py-4 pt-16 bg-background-0 border-b border-background-200">
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
            <VStack className="ml-4 flex-1">
              <Text size="xl" className="font-bold text-typography-900">
                {getPersonName()}
              </Text>
              <Text size="sm" className="text-typography-500">
                {isLender ? "owes you" : "you owe"}
              </Text>
            </VStack>
          </HStack>

          {/* Status Badge */}
          <Box
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusColor + "20" }}
          >
            <Text size="sm" className="font-medium" style={{ color: statusColor }}>
              {debtService.getDebtStatusText(currentDebt.status)}
            </Text>
          </Box>
        </HStack>
      </Box>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-6 py-6">
          <VStack space="xl">
            {/* Amount Summary */}
            <Box className="bg-primary-50 p-6 rounded-xl border border-primary-200">
              <VStack space="md" className="items-center">
                <Text size="sm" className="text-primary-700 font-medium">
                  Outstanding Balance
                </Text>
                <Text size="3xl" className="font-bold text-primary-900">
                  {debtService.formatCurrency(currentDebt.outstandingBalance)}
                </Text>

                {currentDebt.outstandingBalance !== currentDebt.totalAmount && (
                  <VStack space="sm" className="items-center">
                    <Text size="sm" className="text-primary-600">
                      Original Amount: {debtService.formatCurrency(currentDebt.totalAmount)}
                    </Text>
                    <Text size="sm" className="text-success-600">
                      Paid: {debtService.formatCurrency(currentDebt.totalAmount - currentDebt.outstandingBalance)}
                    </Text>
                  </VStack>
                )}
              </VStack>
            </Box>

            {/* Due Date Alert */}
            <Box
              className={`p-4 rounded-lg border ${
                isOverdue
                  ? "bg-error-50 border-error-200"
                  : "bg-warning-50 border-warning-200"
              }`}
            >
              <HStack className="items-center justify-between">
                <VStack className="flex-1">
                  <Text
                    size="sm"
                    className={`font-medium ${
                      isOverdue ? "text-error-700" : "text-warning-700"
                    }`}
                  >
                    {isOverdue ? "Overdue" : "Due Date"}
                  </Text>
                  <Text
                    size="md"
                    className={`font-semibold ${
                      isOverdue ? "text-error-900" : "text-warning-900"
                    }`}
                  >
                    {new Date(currentDebt.dueDate).toLocaleDateString()}
                  </Text>
                  <Text
                    size="sm"
                    className={isOverdue ? "text-error-600" : "text-warning-600"}
                  >
                    {isOverdue
                      ? `Overdue by ${Math.abs(daysUntilDue)} days`
                      : `Due in ${daysUntilDue} days`}
                  </Text>
                </VStack>
                <Ionicons
                  name={isOverdue ? "warning" : "time"}
                  size={24}
                  color={isOverdue ? "#EF4444" : "#F59E0B"}
                />
              </HStack>
            </Box>

            {/* Debt Details */}
            <VStack space="md">
              <Text size="lg" className="font-semibold text-typography-900">
                Details
              </Text>

              <Box className="bg-background-50 rounded-lg border border-background-200">
                <VStack>
                  <DetailRow
                    label="Principal Amount"
                    value={debtService.formatCurrency(currentDebt.principalAmount)}
                  />

                  {currentDebt.interestRate > 0 && (
                    <>
                      <DetailRow
                        label="Interest Rate"
                        value={`${currentDebt.interestRate}% per year`}
                      />
                      <DetailRow
                        label="Interest Amount"
                        value={debtService.formatCurrency(currentDebt.calculatedInterest)}
                      />
                    </>
                  )}

                  <DetailRow
                    label="Total Amount"
                    value={debtService.formatCurrency(currentDebt.totalAmount)}
                    isLast
                  />
                </VStack>
              </Box>

              {/* Contact Info */}
              <Box className="bg-background-50 rounded-lg border border-background-200">
                <VStack>
                  <DetailRow
                    label={isLender ? "Debtor" : "Lender"}
                    value={getPersonName()}
                  />
                  <DetailRow
                    label="Phone"
                    value={currentDebt.debtorPhoneNumber}
                    action={{
                      icon: "call",
                      onPress: handleCallDebtor,
                    }}
                    isLast
                  />
                </VStack>
              </Box>

              {/* Notes */}
              {currentDebt.notes && (
                <VStack space="sm">
                  <Text size="md" className="font-medium text-typography-700">
                    Notes
                  </Text>
                  <Box className="bg-background-50 p-4 rounded-lg border border-background-200">
                    <Text size="sm" className="text-typography-700">
                      {currentDebt.notes}
                    </Text>
                  </Box>
                </VStack>
              )}

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <VStack space="sm">
                  <Text size="md" className="font-medium text-typography-700">
                    Payment History
                  </Text>
                  <Box className="bg-background-50 rounded-lg border border-background-200">
                    <VStack>
                      {paymentHistory.map((payment, index) => (
                        <PaymentHistoryRow
                          key={payment.id}
                          payment={payment}
                          isLast={index === paymentHistory.length - 1}
                        />
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              )}

              {/* Timestamps */}
              <Box className="bg-background-50 rounded-lg border border-background-200">
                <VStack>
                  <DetailRow
                    label="Created"
                    value={new Date(currentDebt.createdAt).toLocaleDateString()}
                  />
                  <DetailRow
                    label="Last Updated"
                    value={new Date(currentDebt.updatedAt).toLocaleDateString()}
                  />
                  {currentDebt.paidAt && (
                    <DetailRow
                      label="Paid At"
                      value={new Date(currentDebt.paidAt).toLocaleDateString()}
                      isLast
                    />
                  )}
                </VStack>
              </Box>
            </VStack>

            {/* Action Buttons */}
            {currentDebt.status === "PENDING" && (
              <VStack space="md">
                <Text size="lg" className="font-semibold text-typography-900">
                  Actions
                </Text>

                {/* For Debtors */}
                {!isLender && (
                  <Button
                    size="lg"
                    className="w-full bg-success-600"
                    onPress={handleMakePayment}
                    isDisabled={actionLoading === "payment"}
                  >
                    <Ionicons name="card" size={20} color="white" />
                    <ButtonText className="ml-2 text-white font-semibold">
                      {actionLoading === "payment" ? "Processing..." : "Make Payment"}
                    </ButtonText>
                  </Button>
                )}

                {/* For Lenders */}
                {isLender && (
                  <VStack space="md">
                    <Button
                      size="lg"
                      className="w-full bg-primary-600"
                      onPress={handleRecordPayment}
                    >
                      <Ionicons name="add-circle" size={20} color="white" />
                      <ButtonText className="ml-2 text-white font-semibold">
                        Record Payment
                      </ButtonText>
                    </Button>

                    <HStack space="md">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 border-primary-600"
                        onPress={handlePaymentReminder}
                        isDisabled={actionLoading === "reminder"}
                      >
                        <Ionicons name="notifications" size={18} color="#4F46E5" />
                        <ButtonText className="ml-1 text-primary-600 font-medium text-sm">
                          {actionLoading === "reminder" ? "Sending..." : "Remind"}
                        </ButtonText>
                      </Button>

                      <Button
                        size="lg"
                        className="flex-1 bg-success-600"
                        onPress={handleMarkAsPaid}
                        isDisabled={actionLoading === "markPaid"}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <ButtonText className="ml-1 text-white font-medium text-sm">
                          {actionLoading === "markPaid" ? "Processing..." : "Mark Paid"}
                        </ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* Edit (for lenders only) */}
                {isLender && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-background-300"
                    onPress={handleEditDebt}
                  >
                    <Ionicons name="create" size={20} color="#374151" />
                    <ButtonText className="ml-2 text-typography-700 font-semibold">
                      Edit Details
                    </ButtonText>
                  </Button>
                )}
              </VStack>
            )}

            {/* Delete Button (for lenders only) */}
            {isLender && (
              <VStack space="md">
                <Text size="lg" className="font-semibold text-typography-900">
                  Danger Zone
                </Text>

                <Button
                  variant="outline"
                  action="negative"
                  size="lg"
                  className="w-full border-error-300"
                  onPress={handleDeleteDebt}
                  isDisabled={actionLoading === "delete"}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <ButtonText className="ml-2 text-error-600 font-semibold">
                    {actionLoading === "delete" ? "Deleting..." : "Delete Debt"}
                  </ButtonText>
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}

// Payment History Row Component
const PaymentHistoryRow = ({
  payment,
  isLast = false,
}: {
  payment: PaymentRow;
  isLast?: boolean;
}) => {
  const getPaymentTypeIcon = () => {
    if (payment.gateway === "manual") {
      return "person"; // Manual entry by lender
    }
    return "card"; // Online payment
  };

  const getPaymentTypeText = () => {
    if (payment.gateway === "manual") {
      return "Manual Entry";
    }
    return "Online Payment";
  };

  const statusColor = payment.status === "SUCCESSFUL" ? "#10B981" :
                     payment.status === "FAILED" ? "#EF4444" : "#F59E0B";

  return (
    <Box className={`px-4 py-3 ${!isLast ? "border-b border-background-300" : ""}`}>
      <VStack space="sm">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Ionicons
              name={getPaymentTypeIcon() as any}
              size={16}
              color="#6B7280"
            />
            <Text size="sm" className="text-typography-700 ml-2 font-medium">
              {debtService.formatCurrency(payment.amount)}
            </Text>
          </HStack>
          <Box
            className="px-2 py-1 rounded"
            style={{ backgroundColor: statusColor + "20" }}
          >
            <Text size="xs" style={{ color: statusColor }}>
              {payment.status}
            </Text>
          </Box>
        </HStack>
        <HStack className="items-center justify-between">
          <Text size="xs" className="text-typography-500">
            {getPaymentTypeText()} • {new Date(payment.paidAt).toLocaleDateString()}
          </Text>
          <Text size="xs" className="text-typography-400">
            {payment.reference}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
};

// Detail Row Component
const DetailRow = ({
  label,
  value,
  action,
  isLast = false,
}: {
  label: string;
  value: string;
  action?: {
    icon: string;
    onPress: () => void;
  };
  isLast?: boolean;
}) => {
  return (
    <Box className={`px-4 py-3 ${!isLast ? "border-b border-background-300" : ""}`}>
      <HStack className="items-center justify-between">
        <Text size="sm" className="text-typography-500 font-medium">
          {label}
        </Text>
        <HStack className="items-center">
          <Text size="sm" className="text-typography-900 font-medium">
            {value}
          </Text>
          {action && (
            <Pressable onPress={action.onPress} className="ml-2">
              <Ionicons name={action.icon as any} size={16} color="#4F46E5" />
            </Pressable>
          )}
        </HStack>
      </HStack>
    </Box>
  );
};
