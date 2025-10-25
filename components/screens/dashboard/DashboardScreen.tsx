import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RefreshControl, ScrollView, Alert } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/lib/store/authStore";
import { useDebts, useDebtActions } from "@/lib/store/debtStore";
import { debtService } from "@/lib/services/debtService";
import { Debt } from "@/lib/types";

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user } = useAuth();
  const { lendingDebts, owingDebts, isLoading } = useDebts();
  const { fetchAllDebts } = useDebtActions();

  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      await fetchAllDebts();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data",
      );
    }
  }, [fetchAllDebts]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  const formatCurrency = useCallback((amount: number) => {
    return debtService.formatCurrency(amount);
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const recentDebts = useMemo(() => {
    return [...lendingDebts, ...owingDebts]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [lendingDebts, owingDebts]);

  // Computed values using useMemo to avoid infinite loops
  const totalLending = useMemo(() => {
    return lendingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0);
  }, [lendingDebts]);

  const totalOwing = useMemo(() => {
    return owingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0);
  }, [owingDebts]);

  const overdueDebts = useMemo(() => {
    const allDebts = [...lendingDebts, ...owingDebts];
    const today = new Date();

    return allDebts.filter((debt) => {
      const dueDate = new Date(debt.dueDate);
      return debt.status === "PENDING" && dueDate < today;
    });
  }, [lendingDebts, owingDebts]);

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Box className="flex-1 px-6 py-4 pt-12">
          <VStack space="lg">
            {/* Header */}
            <VStack space="sm">
              <Text size="lg" className="text-typography-500">
                {getGreeting()},
              </Text>
              <Text size="2xl" className="font-bold text-typography-900">
                {user?.name || "User"}
              </Text>
            </VStack>

            {/* Summary Cards */}
            <VStack space="md">
              <Text size="lg" className="font-semibold text-typography-900">
                Overview
              </Text>

              <HStack space="md">
                {/* Total I'm Owed */}
                <Box className="flex-1 bg-success-50 p-4 rounded-lg border border-success-200">
                  <VStack space="sm">
                    <Text size="sm" className="text-success-700 font-medium">
                      Total I'm Owed
                    </Text>
                    <Text size="xl" className="font-bold text-success-800">
                      {formatCurrency(totalLending)}
                    </Text>
                    <Text size="xs" className="text-success-600">
                      {lendingDebts.length} debt
                      {lendingDebts.length !== 1 ? "s" : ""}
                    </Text>
                  </VStack>
                </Box>

                {/* Total I Owe */}
                <Box className="flex-1 bg-warning-50 p-4 rounded-lg border border-warning-200">
                  <VStack space="sm">
                    <Text size="sm" className="text-warning-700 font-medium">
                      Total I Owe
                    </Text>
                    <Text size="xl" className="font-bold text-warning-800">
                      {formatCurrency(totalOwing)}
                    </Text>
                    <Text size="xs" className="text-warning-600">
                      {owingDebts.length} debt
                      {owingDebts.length !== 1 ? "s" : ""}
                    </Text>
                  </VStack>
                </Box>
              </HStack>

              {/* Overdue Alert */}
              {overdueDebts.length > 0 && (
                <Box className="bg-error-50 p-4 rounded-lg border border-error-200">
                  <HStack space="md" className="items-center">
                    <Box className="flex-1">
                      <Text size="sm" className="text-error-700 font-medium">
                        Overdue Debts
                      </Text>
                      <Text size="xs" className="text-error-600">
                        {overdueDebts.length} debt
                        {overdueDebts.length !== 1 ? "s are" : " is"} overdue
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      action="negative"
                      variant="outline"
                      onPress={() =>
                        navigation.navigate("Debts", { filter: "overdue" })
                      }
                    >
                      <ButtonText>View</ButtonText>
                    </Button>
                  </HStack>
                </Box>
              )}
            </VStack>

            {/* Quick Actions */}
            <VStack space="md">
              <Text size="lg" className="font-semibold text-typography-900">
                Quick Actions
              </Text>

              <HStack space="md">
                <Button
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                  onPress={() =>
                    navigation.navigate("Debts", { screen: "AddDebt" })
                  }
                >
                  <ButtonText>Add Debt</ButtonText>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 border-primary-600"
                  onPress={() => navigation.navigate("Debts")}
                >
                  <ButtonText className="text-primary-600">View All</ButtonText>
                </Button>
              </HStack>
            </VStack>

            {/* Recent Activity */}
            <VStack space="md">
              <HStack className="items-center justify-between">
                <Text size="lg" className="font-semibold text-typography-900">
                  Recent Activity
                </Text>
                <Button
                  variant="link"
                  size="sm"
                  onPress={() => navigation.navigate("Debts")}
                >
                  <ButtonText className="text-primary-600">View All</ButtonText>
                </Button>
              </HStack>

              {recentDebts.length > 0 ? (
                <VStack space="sm">
                  {recentDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onPress={() =>
                        navigation.navigate("Debts", {
                          screen: "DebtDetail",
                          params: { debtId: debt.id },
                        })
                      }
                    />
                  ))}
                </VStack>
              ) : (
                <Box className="bg-background-50 p-8 rounded-lg items-center">
                  <Text size="sm" className="text-typography-500 text-center">
                    No recent activity
                  </Text>
                  <Text
                    size="xs"
                    className="text-typography-400 text-center mt-1"
                  >
                    Add your first debt to get started
                  </Text>
                </Box>
              )}
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}

// Simple Debt Card Component
const DebtCard = React.memo(
  ({ debt, onPress }: { debt: Debt; onPress: () => void }) => {
    const { user } = useAuth();
    const isLender = user?.id === debt.lenderId;
    const statusColor = useMemo(
      () => debtService.getDebtStatusColor(debt.status),
      [debt.status],
    );

    const handlePress = useCallback(() => {
      onPress();
    }, [onPress]);

    return (
      <Box
        className="bg-background-0 p-4 rounded-lg border border-background-200 shadow-sm"
        onTouchEnd={handlePress}
      >
        <HStack className="items-center justify-between">
          <VStack className="flex-1">
            <Text size="sm" className="font-medium text-typography-900">
              {isLender
                ? debt.debtor?.name || `${debt.debtorPhoneNumber}`
                : debt.externalLenderName || debt.lender.name}
            </Text>
            <Text size="xs" className="text-typography-500">
              {isLender ? "owes you" : "you owe"}
            </Text>
          </VStack>

          <VStack className="items-end">
            <Text size="sm" className="font-bold text-typography-900">
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
      </Box>
    );
  },
);
