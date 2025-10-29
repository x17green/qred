"use client"

import { Box } from "@/components/ui/box"
import { Button, ButtonText } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { debtService } from "@/lib/services/debtService"
import { useAuth } from "@/lib/store/authStore"
import { useDebtActions, useDebts } from "@/lib/store/debtStore"
import type { PaymentRow } from "@/lib/types/database"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Linking, RefreshControl, ScrollView } from "react-native"

interface DebtDetailScreenProps {
  navigation: any
  route: {
    params: {
      debtId: string
    }
  }
}

export default function DebtDetailScreen({ navigation, route }: DebtDetailScreenProps) {
  const { debtId } = route.params
  const { user } = useAuth()
  const { currentDebt, isLoading } = useDebts()
  const { fetchDebtById, markDebtAsPaid, deleteDebt, initializePayment, sendPaymentReminder } = useDebtActions()

  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentRow[]>([])

  const loadDebtDetails = useCallback(async () => {
    try {
      await fetchDebtById(debtId)
      // Load payment history
      const payments = await debtService.getPaymentHistory(debtId)
      setPaymentHistory(payments)
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to load debt details")
    }
  }, [debtId, fetchDebtById])

  useEffect(() => {
    loadDebtDetails()
  }, [loadDebtDetails])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadDebtDetails()
    } finally {
      setRefreshing(false)
    }
  }, [loadDebtDetails])

  const isLender = useMemo(() => {
    return user?.id === currentDebt?.lenderId
  }, [user?.id, currentDebt?.lenderId])

  const isOverdue = useMemo(() => {
    if (!currentDebt) return false
    return currentDebt.status === "PENDING" && new Date(currentDebt.dueDate) < new Date()
  }, [currentDebt])

  const daysUntilDue = useMemo(() => {
    if (!currentDebt) return 0
    return debtService.getDaysUntilDue(currentDebt.dueDate)
  }, [currentDebt])

  const handleMarkAsPaid = useCallback(async () => {
    if (!currentDebt) return

    Alert.alert("Mark as Paid", "Are you sure you want to mark this debt as fully paid?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Mark as Paid",
        style: "default",
        onPress: async () => {
          try {
            setActionLoading("markPaid")
            await markDebtAsPaid(debtId)
            Alert.alert("Success", "Debt has been marked as paid successfully.")
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to mark debt as paid")
          } finally {
            setActionLoading(null)
          }
        },
      },
    ])
  }, [currentDebt, debtId, markDebtAsPaid])

  const handleDeleteDebt = useCallback(async () => {
    if (!currentDebt) return

    Alert.alert("Delete Debt", "Are you sure you want to delete this debt? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading("delete")
            await deleteDebt(debtId)
            Alert.alert("Success", "Debt has been deleted successfully.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ])
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete debt")
          } finally {
            setActionLoading(null)
          }
        },
      },
    ])
  }, [currentDebt, debtId, deleteDebt, navigation])

  const handlePaymentReminder = useCallback(async () => {
    if (!currentDebt) return

    try {
      setActionLoading("reminder")
      await sendPaymentReminder(debtId)
      Alert.alert("Reminder Sent", "Payment reminder has been sent to the debtor.")
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send reminder")
    } finally {
      setActionLoading(null)
    }
  }, [currentDebt, debtId, sendPaymentReminder])

  const handleMakePayment = useCallback(async () => {
    if (!currentDebt || !user) return

    Alert.alert("Make Payment", `Pay ₦${currentDebt.outstandingBalance.toLocaleString()} for this debt?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Pay Now",
        onPress: async () => {
          try {
            setActionLoading("payment")
            const paymentResponse = await initializePayment(debtId, currentDebt.outstandingBalance, user.email || "")

            if (paymentResponse.authorization_url) {
              // Open payment gateway
              const supported = await Linking.canOpenURL(paymentResponse.authorization_url)
              if (supported) {
                await Linking.openURL(paymentResponse.authorization_url)
              } else {
                Alert.alert("Error", "Cannot open payment gateway")
              }
            }
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to initialize payment")
          } finally {
            setActionLoading(null)
          }
        },
      },
    ])
  }, [currentDebt, user, debtId, initializePayment])

  const handleEditDebt = useCallback(() => {
    navigation.navigate("EditDebt", { debtId })
  }, [navigation, debtId])

  const handleCallDebtor = useCallback(() => {
    if (!currentDebt) return

    const phoneNumber = currentDebt.debtorPhoneNumber
    Linking.openURL(`tel:${phoneNumber}`)
  }, [currentDebt])

  const handleRecordPayment = useCallback(() => {
    navigation.navigate("RecordPayment", { debtId })
  }, [navigation, debtId])

  if (isLoading && !currentDebt) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center">
        <Text className="text-typography-500">Loading debt details...</Text>
      </Box>
    )
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
        <Button className="mt-6 bg-primary-600" onPress={() => navigation.goBack()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    )
  }

  const getPersonName = () => {
    if (isLender) {
      return debtService.getDebtorDisplayName(currentDebt)
    } else {
      return currentDebt.externalLenderName || currentDebt.lender?.name || "Unknown"
    }
  }

  const getPersonSubtitle = () => {
    if (isLender) {
      if (currentDebt.debtorName && currentDebt.debtorName.trim()) {
        return currentDebt.debtorPhoneNumber
      }
      return currentDebt.debtor ? "Registered User" : currentDebt.debtorPhoneNumber
    } else {
      return currentDebt.isExternal ? "External Lender" : "Qred User"
    }
  }

  const statusColor = debtService.getDebtStatusColor(currentDebt.status)

  return (
    <Box className="flex-1 bg-background-0">
      <LinearGradient
        colors={["#1A2A4D", "#2D3E6F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20 }}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <VStack className="ml-4 flex-1">
              <Text size="xl" className="font-bold text-white">
                {getPersonName()}
              </Text>
              <Text size="sm" className="text-white/80 mt-1">
                {isLender ? "owes you" : "you owe"}
              </Text>
            </VStack>
          </HStack>

          <Box
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: statusColor + "30",
              borderWidth: 1,
              borderColor: statusColor,
            }}
          >
            <Text size="sm" className="font-bold" style={{ color: statusColor }}>
              {debtService.getDebtStatusText(currentDebt.status)}
            </Text>
          </Box>
        </HStack>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-6 py-6">
          <VStack space="xl">
            <LinearGradient
              colors={isLender ? ["#E8F5E9", "#F1F8F4"] : ["#FFF3E0", "#FFF8E1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 24,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: isLender ? "#00E676" : "#FFC107",
                shadowColor: isLender ? "#00E676" : "#FFC107",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <VStack space="md" className="items-center">
                <HStack className="items-center">
                  <Ionicons
                    name={isLender ? "trending-up" : "trending-down"}
                    size={20}
                    color={isLender ? "#00E676" : "#FFC107"}
                  />
                  <Text
                    size="sm"
                    className={`font-semibold ml-2 ${isLender ? "text-success-700" : "text-warning-700"}`}
                  >
                    Outstanding Balance
                  </Text>
                </HStack>
                <Text size="4xl" className={`font-bold ${isLender ? "text-success-900" : "text-warning-900"}`}>
                  {debtService.formatCurrency(currentDebt.outstandingBalance)}
                </Text>

                {currentDebt.outstandingBalance !== currentDebt.totalAmount && (
                  <VStack space="sm" className="items-center mt-2">
                    <HStack className="items-center">
                      <Ionicons name="information-circle" size={14} color="#6B7280" />
                      <Text size="sm" className="text-typography-600 ml-1">
                        Original: {debtService.formatCurrency(currentDebt.totalAmount)}
                      </Text>
                    </HStack>
                    <HStack className="items-center">
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text size="sm" className="text-success-600 font-medium ml-1">
                        Paid: {debtService.formatCurrency(currentDebt.totalAmount - currentDebt.outstandingBalance)}
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </LinearGradient>

            <Box
              className={`p-5 rounded-2xl border-2`}
              style={{
                backgroundColor: isOverdue ? "#FEE2E2" : "#FEF3C7",
                borderColor: isOverdue ? "#EF4444" : "#F59E0B",
                shadowColor: isOverdue ? "#EF4444" : "#F59E0B",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <HStack className="items-center justify-between">
                <VStack className="flex-1">
                  <HStack className="items-center">
                    <Ionicons
                      name={isOverdue ? "warning" : "time"}
                      size={20}
                      color={isOverdue ? "#EF4444" : "#F59E0B"}
                    />
                    <Text size="sm" className={`font-bold ml-2 ${isOverdue ? "text-error-700" : "text-warning-700"}`}>
                      {isOverdue ? "OVERDUE" : "DUE DATE"}
                    </Text>
                  </HStack>
                  <Text size="lg" className={`font-bold mt-2 ${isOverdue ? "text-error-900" : "text-warning-900"}`}>
                    {new Date(currentDebt.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Text size="sm" className={`mt-1 font-medium ${isOverdue ? "text-error-700" : "text-warning-700"}`}>
                    {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
                  </Text>
                </VStack>
                <Box
                  className={`w-16 h-16 rounded-full items-center justify-center ${
                    isOverdue ? "bg-error-100" : "bg-warning-100"
                  }`}
                >
                  <Text size="2xl" className={`font-bold ${isOverdue ? "text-error-700" : "text-warning-700"}`}>
                    {Math.abs(daysUntilDue)}
                  </Text>
                </Box>
              </HStack>
            </Box>

            <VStack space="md">
              <Text size="lg" className="font-bold text-typography-900">
                Details
              </Text>

              <Box
                className="bg-white rounded-2xl border-2 border-background-200 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <VStack>
                  <DetailRow label="Principal Amount" value={debtService.formatCurrency(currentDebt.principalAmount)} />

                  {currentDebt.interestRate > 0 && (
                    <>
                      <DetailRow label="Interest Rate" value={`${currentDebt.interestRate}% per year`} />
                      <DetailRow
                        label="Interest Amount"
                        value={debtService.formatCurrency(currentDebt.calculatedInterest)}
                      />
                    </>
                  )}

                  <DetailRow label="Total Amount" value={debtService.formatCurrency(currentDebt.totalAmount)} isLast />
                </VStack>
              </Box>

              <Box
                className="bg-white rounded-2xl border-2 border-background-200 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <VStack>
                  <DetailRow label={isLender ? "Debtor" : "Lender"} value={getPersonName()} />
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
                  <Text size="md" className="font-bold text-typography-900">
                    Notes
                  </Text>
                  <Box
                    className="bg-background-50 p-5 rounded-2xl border-2 border-background-200"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text size="sm" className="text-typography-700 leading-relaxed">
                      {currentDebt.notes}
                    </Text>
                  </Box>
                </VStack>
              )}

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <VStack space="sm">
                  <Text size="md" className="font-bold text-typography-900">
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
                  <DetailRow label="Created" value={new Date(currentDebt.createdAt).toLocaleDateString()} />
                  <DetailRow label="Last Updated" value={new Date(currentDebt.updatedAt).toLocaleDateString()} />
                  {currentDebt.paidAt && (
                    <DetailRow label="Paid At" value={new Date(currentDebt.paidAt).toLocaleDateString()} isLast />
                  )}
                </VStack>
              </Box>
            </VStack>

            {currentDebt.status === "PENDING" && (
              <VStack space="md">
                <Text size="lg" className="font-bold text-typography-900">
                  Actions
                </Text>

                {/* For Debtors */}
                {!isLender && (
                  <Pressable onPress={handleMakePayment} disabled={actionLoading === "payment"}>
                    <LinearGradient
                      colors={["#00E676", "#00C853"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 18,
                        borderRadius: 16,
                        shadowColor: "#00E676",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      <HStack className="items-center justify-center">
                        <Ionicons name="card" size={22} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                          {actionLoading === "payment" ? "Processing..." : "Make Payment"}
                        </Text>
                      </HStack>
                    </LinearGradient>
                  </Pressable>
                )}

                {/* For Lenders */}
                {isLender && (
                  <VStack space="md">
                    <Button size="lg" className="w-full bg-primary-600" onPress={handleRecordPayment}>
                      <Ionicons name="add-circle" size={20} color="white" />
                      <ButtonText className="ml-2 text-white font-semibold">Record Payment</ButtonText>
                    </Button>

                    <HStack space="md">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 border-primary-600 bg-transparent"
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
                    className="w-full border-background-300 bg-transparent"
                    onPress={handleEditDebt}
                  >
                    <Ionicons name="create" size={20} color="#374151" />
                    <ButtonText className="ml-2 text-typography-700 font-semibold">Edit Details</ButtonText>
                  </Button>
                )}
              </VStack>
            )}

            {/* Delete Button (for lenders only) */}
            {isLender && (
              <VStack space="md">
                <Text size="lg" className="font-bold text-typography-900">
                  Danger Zone
                </Text>

                <Button
                  variant="outline"
                  action="negative"
                  size="lg"
                  className="w-full border-error-300 bg-transparent"
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
  )
}

// Payment History Row Component
const PaymentHistoryRow = ({
  payment,
  isLast = false,
}: {
  payment: PaymentRow
  isLast?: boolean
}) => {
  const getPaymentTypeIcon = () => {
    if (payment.gateway === "manual") {
      return "person" // Manual entry by lender
    }
    return "card" // Online payment
  }

  const getPaymentTypeText = () => {
    if (payment.gateway === "manual") {
      return "Manual Entry"
    }
    return "Online Payment"
  }

  const statusColor = payment.status === "SUCCESSFUL" ? "#10B981" : payment.status === "FAILED" ? "#EF4444" : "#F59E0B"

  return (
    <Box className={`px-4 py-3 ${!isLast ? "border-b border-background-300" : ""}`}>
      <VStack space="sm">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Ionicons name={getPaymentTypeIcon() as any} size={16} color="#6B7280" />
            <Text size="sm" className="text-typography-700 ml-2 font-medium">
              {debtService.formatCurrency(payment.amount)}
            </Text>
          </HStack>
          <Box className="px-2 py-1 rounded" style={{ backgroundColor: statusColor + "20" }}>
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
  )
}

// Detail Row Component
const DetailRow = ({
  label,
  value,
  action,
  isLast = false,
}: {
  label: string
  value: string
  action?: {
    icon: string
    onPress: () => void
  }
  isLast?: boolean
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
  )
}
