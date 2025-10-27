import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { debtService } from "@/lib/services/debtService";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts, useSearchDebts } from "@/lib/store/debtStore";
import { DebtWithRelations } from "@/lib/types/database";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";

interface DebtsListScreenProps {
  navigation: any;
  route?: {
    params?: {
      filter?: "all" | "overdue" | "pending";
      tab?: "lending" | "owing";
    };
  };
}

type TabType = "lending" | "owing";

export default function DebtsListScreen({ navigation, route }: DebtsListScreenProps) {
  const { user } = useAuth();
  const { lendingDebts, owingDebts, isLoading } = useDebts();
  const { fetchAllDebts } = useDebtActions();
  const searchDebts = useSearchDebts();

  const [activeTab, setActiveTab] = useState<TabType>("lending");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Initialize active tab from route params
  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const loadDebts = useCallback(async () => {
    try {
      await fetchAllDebts();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load debts"
      );
    }
  }, [fetchAllDebts]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDebts();
    } finally {
      setRefreshing(false);
    }
  }, [loadDebts]);

  const filteredDebts = useMemo(() => {
    const debts = activeTab === "lending" ? lendingDebts : owingDebts;

    if (!searchQuery.trim()) {
      // Apply route filter if no search query
      if (route?.params?.filter === "overdue") {
        return debts.filter(debt =>
          debt.status === "PENDING" &&
          new Date(debt.dueDate) < new Date()
        );
      }
      if (route?.params?.filter === "pending") {
        return debts.filter(debt => debt.status === "PENDING");
      }
      return debts;
    }

    // Search functionality
    const query = searchQuery.toLowerCase();
    return debts.filter(debt => {
      const debtorName = debt.debtor?.name?.toLowerCase() || "";
      const lenderName = debt.lender?.name?.toLowerCase() || "";
      const phone = debt.debtorPhoneNumber.toLowerCase();
      const notes = debt.notes?.toLowerCase() || "";
      const externalName = debt.externalLenderName?.toLowerCase() || "";

      return (
        debtorName.includes(query) ||
        lenderName.includes(query) ||
        phone.includes(query) ||
        notes.includes(query) ||
        externalName.includes(query)
      );
    });
  }, [activeTab, lendingDebts, owingDebts, searchQuery, route?.params?.filter]);

  const handleAddDebt = useCallback(() => {
    navigation.navigate("AddDebt");
  }, [navigation]);

  const handleDebtPress = useCallback((debt: DebtWithRelations) => {
    navigation.navigate("DebtDetail", { debtId: debt.id });
  }, [navigation]);

  const getTabCounts = useMemo(() => {
    return {
      lending: lendingDebts.length,
      owing: owingDebts.length,
    };
  }, [lendingDebts, owingDebts]);

  const getTotalAmount = useMemo(() => {
    const debts = activeTab === "lending" ? lendingDebts : owingDebts;
    return debts.reduce((sum, debt) => sum + debt.outstandingBalance, 0);
  }, [activeTab, lendingDebts, owingDebts]);

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box className="px-6 py-4 pt-16 bg-background-0 border-b border-background-200">
        <VStack space="lg">
          <HStack className="items-center justify-between">
            <VStack>
              <Text size="2xl" className="font-bold text-typography-900">
                My Debts
              </Text>
              <Text size="sm" className="text-typography-500">
                Track and manage your debts
              </Text>
            </VStack>
            <Button
              size="sm"
              className="bg-primary-600"
              onPress={handleAddDebt}
            >
              <Ionicons name="add" size={16} color="white" />
              <ButtonText className="ml-1">Add</ButtonText>
            </Button>
          </HStack>

          {/* Search */}
          <Input variant="outline" size="md" className="border-background-300">
            <InputField
              placeholder="Search debts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="text-typography-900"
            />
          </Input>

          {/* Tabs */}
          <HStack space="sm">
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setActiveTab("lending")}
            >
              <Box
                className={`p-3 rounded-lg border ${
                  activeTab === "lending"
                    ? "bg-primary-600 border-primary-600"
                    : "bg-background-50 border-background-300"
                }`}
              >
                <VStack className="items-center">
                  <Text
                    size="sm"
                    className={`font-medium ${
                      activeTab === "lending"
                        ? "text-white"
                        : "text-typography-700"
                    }`}
                  >
                    I'm Owed
                  </Text>
                  <Text
                    size="xs"
                    className={
                      activeTab === "lending"
                        ? "text-primary-100"
                        : "text-typography-500"
                    }
                  >
                    {getTabCounts.lending} debts
                  </Text>
                </VStack>
              </Box>
            </Pressable>

            <Pressable
              style={{ flex: 1 }}
              onPress={() => setActiveTab("owing")}
            >
              <Box
                className={`p-3 rounded-lg border ${
                  activeTab === "owing"
                    ? "bg-primary-600 border-primary-600"
                    : "bg-background-50 border-background-300"
                }`}
              >
                <VStack className="items-center">
                  <Text
                    size="sm"
                    className={`font-medium ${
                      activeTab === "owing"
                        ? "text-white"
                        : "text-typography-700"
                    }`}
                  >
                    I Owe
                  </Text>
                  <Text
                    size="xs"
                    className={
                      activeTab === "owing"
                        ? "text-primary-100"
                        : "text-typography-500"
                    }
                  >
                    {getTabCounts.owing} debts
                  </Text>
                </VStack>
              </Box>
            </Pressable>
          </HStack>

          {/* Total Amount */}
          <Box className="bg-background-50 p-4 rounded-lg">
            <VStack space="sm" className="items-center">
              <Text size="sm" className="text-typography-500">
                {activeTab === "lending" ? "Total I'm Owed" : "Total I Owe"}
              </Text>
              <Text size="xl" className="font-bold text-typography-900">
                {debtService.formatCurrency(getTotalAmount)}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Debts List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-6 py-4">
          {isLoading && filteredDebts.length === 0 ? (
            <Box className="py-8">
              <Text className="text-center text-typography-500">
                Loading debts...
              </Text>
            </Box>
          ) : filteredDebts.length === 0 ? (
            <EmptyState
              activeTab={activeTab}
              hasSearchQuery={!!searchQuery.trim()}
              onAddDebt={handleAddDebt}
              onClearSearch={() => setSearchQuery("")}
            />
          ) : (
            <VStack space="md">
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
  );
}

// Debt Card Component
const DebtCard = React.memo(
  ({
    debt,
    isLender,
    onPress
  }: {
    debt: DebtWithRelations;
    isLender: boolean;
    onPress: () => void
  }) => {
    const statusColor = useMemo(
      () => debtService.getDebtStatusColor(debt.status),
      [debt.status]
    );

    const isOverdue = useMemo(() => {
      return debt.status === "PENDING" && new Date(debt.dueDate) < new Date();
    }, [debt.status, debt.dueDate]);

    const daysUntilDue = useMemo(() => {
      return debtService.getDaysUntilDue(debt.dueDate);
    }, [debt.dueDate]);

    const getPersonName = () => {
      if (isLender) {
        return debt.debtor?.name || debt.debtorPhoneNumber;
      } else {
        return debt.externalLenderName || debt.lender?.name || "Unknown";
      }
    };

    const getPersonSubtitle = () => {
      if (isLender) {
        return debt.debtor ? "Registered User" : debt.debtorPhoneNumber;
      } else {
        return debt.isExternal ? "External Lender" : "Qred User";
      }
    };

    return (
      <Pressable onPress={onPress}>
        <Box className="bg-background-0 p-4 rounded-lg border border-background-200 shadow-sm">
          <VStack space="md">
            {/* Header */}
            <HStack className="items-start justify-between">
              <VStack className="flex-1">
                <Text size="md" className="font-semibold text-typography-900">
                  {getPersonName()}
                </Text>
                <Text size="sm" className="text-typography-500">
                  {getPersonSubtitle()}
                </Text>
              </VStack>

              <VStack className="items-end">
                <Text size="lg" className="font-bold text-typography-900">
                  {debtService.formatCurrency(debt.outstandingBalance)}
                </Text>
                <Box
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: statusColor + "20" }}
                >
                  <Text size="xs" style={{ color: statusColor }}>
                    {debtService.getDebtStatusText(debt.status)}
                  </Text>
                </Box>
              </VStack>
            </HStack>

            {/* Details */}
            <HStack className="items-center justify-between">
              <VStack>
                <Text size="xs" className="text-typography-400">
                  Due Date
                </Text>
                <Text
                  size="sm"
                  className={`font-medium ${
                    isOverdue ? "text-error-600" : "text-typography-700"
                  }`}
                >
                  {new Date(debt.dueDate).toLocaleDateString()}
                </Text>
              </VStack>

              <VStack className="items-end">
                <Text size="xs" className="text-typography-400">
                  {isOverdue ? "Overdue by" : "Due in"}
                </Text>
                <Text
                  size="sm"
                  className={`font-medium ${
                    isOverdue ? "text-error-600" : "text-typography-700"
                  }`}
                >
                  {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? "s" : ""}
                </Text>
              </VStack>
            </HStack>

            {/* Notes */}
            {debt.notes && (
              <Text size="sm" className="text-typography-500" numberOfLines={2}>
                {debt.notes}
              </Text>
            )}

            {/* Interest Rate */}
            {debt.interestRate > 0 && (
              <HStack className="items-center">
                <Text size="xs" className="text-typography-400">
                  Interest Rate:
                </Text>
                <Text size="xs" className="text-typography-600 ml-1">
                  {debt.interestRate}% per year
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </Pressable>
    );
  }
);

// Empty State Component
const EmptyState = ({
  activeTab,
  hasSearchQuery,
  onAddDebt,
  onClearSearch,
}: {
  activeTab: TabType;
  hasSearchQuery: boolean;
  onAddDebt: () => void;
  onClearSearch: () => void;
}) => {
  if (hasSearchQuery) {
    return (
      <Box className="py-16 items-center">
        <Ionicons name="search" size={48} color="#9CA3AF" />
        <Text size="lg" className="font-medium text-typography-600 mt-4">
          No debts found
        </Text>
        <Text size="sm" className="text-typography-500 mt-2 text-center">
          No debts match your search criteria
        </Text>
        <Button
          variant="link"
          size="sm"
          className="mt-4"
          onPress={onClearSearch}
        >
          <ButtonText className="text-primary-600">Clear search</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <Box className="py-16 items-center">
      <Ionicons
        name={activeTab === "lending" ? "wallet-outline" : "card-outline"}
        size={48}
        color="#9CA3AF"
      />
      <Text size="lg" className="font-medium text-typography-600 mt-4">
        No {activeTab === "lending" ? "lending" : "owing"} debts
      </Text>
      <Text size="sm" className="text-typography-500 mt-2 text-center px-8">
        {activeTab === "lending"
          ? "You haven't lent money to anyone yet. Start tracking debts by adding your first one."
          : "You don't owe anyone money. That's great! Keep it up."
        }
      </Text>
      {activeTab === "lending" && (
        <Button
          size="md"
          className="bg-primary-600 mt-6"
          onPress={onAddDebt}
        >
          <Ionicons name="add" size={16} color="white" />
          <ButtonText className="ml-2">Add First Debt</ButtonText>
        </Button>
      )}
    </Box>
  );
};
