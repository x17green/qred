"use client"

import { Box } from "@/components/ui/box"
import { Button, ButtonText } from "@/components/ui/button"
import { HStack } from "@/components/ui/hstack"
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { BorderRadius, Gradients, QredColors, SemanticColors, Shadows } from "@/lib/constants/colors"
import { debtService } from "@/lib/services/debtService"
import { useAuth } from "@/lib/store/authStore"
import { useDebtActions, useDebts, useSearchDebts } from "@/lib/store/debtStore"
import type { DebtWithRelations } from "@/lib/types/database"
import { LinearGradient } from "expo-linear-gradient"
import { AlertCircle, Calendar, Plus, Search, TrendingDown, TrendingUp } from "lucide-react-native"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, RefreshControl, ScrollView } from "react-native"

interface DebtsListScreenProps {
  navigation: any
  route?: {
    params?: {
      filter?: "all" | "overdue" | "pending"
      tab?: "lending" | "owing"
    }
  }
}

type TabType = "lending" | "owing"

export default function DebtsListScreen({ navigation, route }: DebtsListScreenProps) {
  const { user } = useAuth()
  const { lendingDebts, owingDebts, isLoading } = useDebts()
  const { fetchAllDebts } = useDebtActions()
  const searchDebts = useSearchDebts()

  const [activeTab, setActiveTab] = useState<TabType>("lending")
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Initialize active tab from route params
  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab)
    }
  }, [route?.params?.tab])

  const loadDebts = useCallback(async () => {
    try {
      await fetchAllDebts()
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to load debts")
    }
  }, [fetchAllDebts])

  useEffect(() => {
    loadDebts()
  }, [loadDebts])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadDebts()
    } finally {
      setRefreshing(false)
    }
  }, [loadDebts])

  const filteredDebts = useMemo(() => {
    const debts = activeTab === "lending" ? lendingDebts : owingDebts

    if (!searchQuery.trim()) {
      // Apply route filter if no search query
      if (route?.params?.filter === "overdue") {
        return debts.filter((debt) => debt.status === "PENDING" && new Date(debt.dueDate) < new Date())
      }
      if (route?.params?.filter === "pending") {
        return debts.filter((debt) => debt.status === "PENDING")
      }
      return debts
    }

    // Search functionality
    const query = searchQuery.toLowerCase()
    return debts.filter((debt) => {
      const debtorName = debt.debtor?.name?.toLowerCase() || ""
      const customDebtorName = debt.debtorName?.toLowerCase() || ""
      const lenderName = debt.lender?.name?.toLowerCase() || ""
      const phone = debt.debtorPhoneNumber.toLowerCase()
      const notes = debt.notes?.toLowerCase() || ""
      const externalName = debt.externalLenderName?.toLowerCase() || ""

      return (
        debtorName.includes(query) ||
        customDebtorName.includes(query) ||
        lenderName.includes(query) ||
        phone.includes(query) ||
        notes.includes(query) ||
        externalName.includes(query)
      )
    })
  }, [activeTab, lendingDebts, owingDebts, searchQuery, route?.params?.filter])

  const handleAddDebt = useCallback(() => {
    navigation.navigate("AddDebt")
  }, [navigation])

  const handleDebtPress = useCallback(
    (debt: DebtWithRelations) => {
      navigation.navigate("DebtDetail", { debtId: debt.id })
    },
    [navigation],
  )

  const getTabCounts = useMemo(() => {
    return {
      lending: lendingDebts.length,
      owing: owingDebts.length,
    }
  }, [lendingDebts, owingDebts])

  const getTotalAmount = useMemo(() => {
    const debts = activeTab === "lending" ? lendingDebts : owingDebts
    return debts.reduce((sum, debt) => sum + debt.outstandingBalance, 0)
  }, [activeTab, lendingDebts, owingDebts])

  return (
    <Box className="flex-1" style={{ backgroundColor: QredColors.background.light }}>
      <Box className="overflow-hidden">
        <LinearGradient
          colors={Gradients.brandPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
        >
          <VStack space="lg">
            <HStack className="items-center justify-between">
              <VStack>
                <Text size="2xl" className="font-bold text-white">
                  My Debts
                </Text>
                <Text size="sm" className="text-white/70">
                  Track and manage your debts
                </Text>
              </VStack>
              <Pressable
                onPress={handleAddDebt}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: QredColors.accent.green }}
              >
                <Plus size={24} color="white" />
              </Pressable>
            </HStack>

            <Input
              variant="outline"
              size="md"
              style={{
                borderWidth: 1.5,
                borderColor: QredColors.text.inverse + '20',
                backgroundColor: QredColors.text.inverse + '10',
                borderRadius: BorderRadius.lg,
              }}
            >
              <InputSlot className="pl-3">
                <InputIcon as={Search} className="text-white/60" size="sm" />
              </InputSlot>
              <InputField
                placeholder="Search debts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="text-white pl-2"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </Input>

            <HStack space="md">
              <Pressable style={{ flex: 1 }} onPress={() => setActiveTab("lending")}>
                <Box
                  className="p-4"
                  style={{
                    backgroundColor: activeTab === "lending" ? QredColors.accent.green : QredColors.text.inverse + '10',
                    borderRadius: BorderRadius.lg,
                  }}
                >
                  <VStack className="items-center" space="xs">
                    <TrendingUp size={20} color="white" />
                    <Text size="sm" className="font-bold text-white">
                      I'm Owed
                    </Text>
                    <Text size="xs" className="text-white/80">
                      {getTabCounts.lending} debts
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              <Pressable style={{ flex: 1 }} onPress={() => setActiveTab("owing")}>
                <Box
                  className="p-4"
                  style={{
                    backgroundColor: activeTab === "owing" ? QredColors.status.warning[500] : QredColors.text.inverse + '10',
                    borderRadius: BorderRadius.lg,
                  }}
                >
                  <VStack className="items-center" space="xs">
                    <TrendingDown size={20} color="white" />
                    <Text size="sm" className="font-bold text-white">
                      I Owe
                    </Text>
                    <Text size="xs" className="text-white/80">
                      {getTabCounts.owing} debts
                    </Text>
                  </VStack>
                </Box>
              </Pressable>
            </HStack>

            <Box
              className="p-5"
              style={{
                backgroundColor: QredColors.text.inverse + '15',
                borderWidth: 1,
                borderColor: QredColors.text.inverse + '20',
                borderRadius: BorderRadius.lg,
              }}
            >
              <VStack space="sm" className="items-center">
                <Text size="sm" className="text-white/70 font-medium">
                  {activeTab === "lending" ? "Total I'm Owed" : "Total I Owe"}
                </Text>
                <Text size="2xl" className="font-bold text-white">
                  {debtService.formatCurrency(getTotalAmount)}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </LinearGradient>
      </Box>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: SemanticColors.secondarySurface }}
      >
        <Box className="px-3 py-3 md:px-4 md:py-4">
          {isLoading && filteredDebts.length === 0 ? (
            <Box className="py-8">
              <Text className="text-center text-typography-500">Loading debts...</Text>
            </Box>
          ) : filteredDebts.length === 0 ? (
            <EmptyState
              activeTab={activeTab}
              hasSearchQuery={!!searchQuery.trim()}
              onAddDebt={handleAddDebt}
              onClearSearch={() => setSearchQuery("")}
            />
          ) : (
            <VStack space="sm">
              {filteredDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt as DebtWithRelations}
                  isLender={activeTab === "lending"}
                  onPress={() => handleDebtPress(debt as DebtWithRelations)}
                />
              ))}
            </VStack>
          )}
        </Box>
      </ScrollView>
    </Box>
  )
}

const DebtCard = React.memo(
  ({
    debt,
    isLender,
    onPress,
  }: {
    debt: DebtWithRelations
    isLender: boolean
    onPress: () => void
  }) => {
    const statusColor = useMemo(() => debtService.getDebtStatusColor(debt.status), [debt.status])

    const isOverdue = useMemo(() => {
      return debt.status === "PENDING" && new Date(debt.dueDate) < new Date()
    }, [debt.status, debt.dueDate])

    const daysUntilDue = useMemo(() => {
      return debtService.getDaysUntilDue(debt.dueDate)
    }, [debt.dueDate])

    const getPersonName = () => {
      if (isLender) {
        // Prioritize custom debtor name, then registered user name, then phone
        if (debt.debtorName && debt.debtorName.trim()) {
          return debt.debtorName
        }
        return debt.debtor?.name || debt.debtorPhoneNumber
      } else {
        return debt.externalLenderName || debt.lender?.name || "Unknown"
      }
    }

    const getPersonSubtitle = () => {
      if (isLender) {
        if (debt.debtorName && debt.debtorName.trim()) {
          return debt.debtorPhoneNumber
        }
        return debt.debtor ? "Registered User" : debt.debtorPhoneNumber
      } else {
        return debt.isExternal ? "External Lender" : "Qred User"
      }
    }

    return (
      <Pressable onPress={onPress}>
        <Box
          className="p-5 border"
          style={{
            backgroundColor: QredColors.background.light,
            borderRadius: BorderRadius.lg,
            borderWidth: 1.5,
            borderColor: QredColors.border.light,
            ...Shadows.sm,
          }}
        >
          <VStack space="md">
            <HStack className="items-start justify-between">
              <VStack className="flex-1" space="xs">
                <Text size="md" className="font-bold text-typography-900">
                  {getPersonName()}
                </Text>
                <Text size="sm" className="text-typography-500">
                  {getPersonSubtitle()}
                </Text>
              </VStack>

              <VStack className="items-end" space="xs">
                <Text size="lg" className="font-bold text-typography-900">
                  {debtService.formatCurrency(debt.outstandingBalance)}
                </Text>
                <Box className="px-3 py-1 rounded-lg" style={{ backgroundColor: statusColor + "20" }}>
                  <Text size="xs" className="font-semibold" style={{ color: statusColor }}>
                    {debtService.getDebtStatusText(debt.status)}
                  </Text>
                </Box>
              </VStack>
            </HStack>

            <Box className="p-3" style={{ backgroundColor: QredColors.background.elevated, borderRadius: BorderRadius.lg }}>
              <HStack className="items-center justify-between">
                <HStack className="items-center" space="xs">
                  <Calendar size={14} color={QredColors.text.tertiary} />
                  <Text size="xs" className="font-medium" style={{ color: QredColors.text.secondary }}>
                    Due Date
                  </Text>
                </HStack>
                <Text size="sm" className="font-bold" style={{ color: isOverdue ? QredColors.status.error[600] : QredColors.text.primary }}>
                  {new Date(debt.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Text>
              </HStack>

              {(isOverdue || daysUntilDue <= 7) && (
                <HStack className="items-center justify-between mt-2">
                  <HStack className="items-center" space="xs">
                    <AlertCircle size={14} color={isOverdue ? QredColors.status.error[500] : QredColors.status.warning[500]} />
                    <Text size="xs" className="font-medium" style={{ color: isOverdue ? QredColors.status.error[600] : QredColors.status.warning[600] }}>
                      {isOverdue ? "Overdue by" : "Due in"}
                    </Text>
                  </HStack>
                  <Text size="sm" className="font-bold" style={{ color: isOverdue ? QredColors.status.error[600] : QredColors.status.warning[600] }}>
                    {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? "s" : ""}
                  </Text>
                </HStack>
              )}
            </Box>

            {debt.notes && (
              <Text size="sm" style={{ color: QredColors.text.secondary }} numberOfLines={2}>
                {debt.notes}
              </Text>
            )}

            {debt.interestRate > 0 && (
              <Box className="px-3 py-2" style={{ backgroundColor: QredColors.status.warning[50], borderRadius: BorderRadius.md }}>
                <Text size="xs" className="font-medium" style={{ color: QredColors.text.secondary }}>
                  Interest: {debt.interestRate}%
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Pressable>
    )
  },
)

// Empty State Component
const EmptyState = ({
  activeTab,
  hasSearchQuery,
  onAddDebt,
  onClearSearch,
}: {
  activeTab: TabType
  hasSearchQuery: boolean
  onAddDebt: () => void
  onClearSearch: () => void
}) => {
  if (hasSearchQuery) {
    return (
      <Box className="py-16 items-center">
        <Search size={48} color={QredColors.text.quaternary} />
        <Text size="lg" className="font-medium mt-4" style={{ color: QredColors.text.secondary }}>
          No debts found
        </Text>
        <Text size="sm" className="mt-2 text-center" style={{ color: QredColors.text.tertiary }}>
          No debts match your search criteria
        </Text>
        <Button variant="link" size="sm" className="mt-4" onPress={onClearSearch}>
          <ButtonText style={{ color: QredColors.brand.navy }}>Clear search</ButtonText>
        </Button>
      </Box>
    )
  }

  return (
    <Box className="py-16 items-center">
      <TrendingUp size={48} color={QredColors.text.quaternary} />
      <Text size="lg" className="font-medium mt-4" style={{ color: QredColors.text.secondary }}>
        No {activeTab === "lending" ? "lending" : "owing"} debts
      </Text>
      <Text size="sm" className="mt-2 text-center px-8" style={{ color: QredColors.text.tertiary }}>
        {activeTab === "lending"
          ? "You haven't lent money to anyone yet. Start tracking debts by adding your first one."
          : "You don't owe anyone money. That's great! Keep it up."}
      </Text>
      {activeTab === "lending" && (
        <Button size="md" className="mt-6" onPress={onAddDebt} style={{ backgroundColor: QredColors.brand.navy }}>
          <Plus size={16} color={QredColors.text.inverse} />
          <ButtonText className="ml-2 text-white">Add First Debt</ButtonText>
        </Button>
      )}
    </Box>
  )
}
