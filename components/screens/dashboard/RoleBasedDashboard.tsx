import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts } from "@/lib/store/debtStore";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Clock, DollarSign, Plus, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";

interface DashboardProps {
  navigation?: any;
}

interface SummaryCardProps {
  title: string;
  amount: number;
  count: number;
  icon: React.ComponentType<any>;
  variant: "primary" | "secondary" | "success" | "warning";
  onPress?: () => void;
}

function SummaryCard({ title, amount, count, icon, variant, onPress }: SummaryCardProps) {
  const variantStyles = {
    primary: {
      bg: "bg-primary-50",
      iconBg: "bg-primary-500",
      iconColor: "text-white",
      titleColor: "text-primary-700",
      amountColor: "text-primary-900",
    },
    secondary: {
      bg: "bg-background-100",
      iconBg: "bg-background-500",
      iconColor: "text-white",
      titleColor: "text-typography-700",
      amountColor: "text-typography-900",
    },
    success: {
      bg: "bg-success-50",
      iconBg: "bg-success-500",
      iconColor: "text-white",
      titleColor: "text-success-700",
      amountColor: "text-success-900",
    },
    warning: {
      bg: "bg-warning-50",
      iconBg: "bg-warning-500",
      iconColor: "text-white",
      titleColor: "text-warning-700",
      amountColor: "text-warning-900",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      className={`${styles.bg} p-4 rounded-xl border border-opacity-20`}
    >
      <HStack space="md" className="items-center">
        <Box className={`w-12 h-12 rounded-full ${styles.iconBg} items-center justify-center`}>
          <Icon as={icon} size="lg" className={styles.iconColor} />
        </Box>

        <VStack space="xs" className="flex-1">
          <Text size="sm" className={`${styles.titleColor} font-medium`}>
            {title}
          </Text>
          <Text size="2xl" bold className={styles.amountColor}>
            ₦{amount.toLocaleString()}
          </Text>
          <Text size="xs" className="text-typography-500">
            {count} {count === 1 ? 'debt' : 'debts'}
          </Text>
        </VStack>

        {onPress && (
          <Icon as={ArrowUpRight} size="sm" className="text-typography-400" />
        )}
      </HStack>
    </Pressable>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

function QuickAction({ title, description, icon, onPress, variant = "primary" }: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      className={`
        p-4 rounded-xl border-2 transition-all
        ${isPrimary
          ? 'border-primary-200 bg-primary-50 data-[hover=true]:border-primary-300'
          : 'border-background-300 bg-background-0 data-[hover=true]:border-background-400'
        }
      `}
    >
      <VStack space="sm" className="items-center">
        <Box
          className={`
            w-16 h-16 rounded-full items-center justify-center
            ${isPrimary ? 'bg-primary-500' : 'bg-background-200'}
          `}
        >
          <Icon
            as={icon}
            size="xl"
            className={isPrimary ? 'text-white' : 'text-typography-600'}
          />
        </Box>
        <Text
          size="md"
          bold
          className={`text-center ${isPrimary ? 'text-primary-700' : 'text-typography-700'}`}
        >
          {title}
        </Text>
        <Text
          size="sm"
          className={`text-center ${isPrimary ? 'text-primary-600' : 'text-typography-500'}`}
        >
          {description}
        </Text>
      </VStack>
    </Pressable>
  );
}

export default function RoleBasedDashboard({ navigation }: DashboardProps) {
  const { user } = useAuth();
  const { lendingDebts, owingDebts, isLoading } = useDebts();
  const { fetchAllDebts } = useDebtActions();

  const [refreshing, setRefreshing] = useState(false);

  const userRole = user?.defaultRole || 'BORROWER';
  const isLender = userRole === 'LENDER';

  useEffect(() => {
    if (user?.id) {
      fetchAllDebts();
    }
  }, [user?.id, fetchAllDebts]);

  // Calculate summary from current debt data
  const summary = {
    totalLending: lendingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0),
    totalOwing: owingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0),
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllDebts();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddLoan = () => {
    navigation?.navigate('Debts', {
      screen: 'AddDebt',
      params: { mode: 'lending' }
    });
  };

  const handleAddDebt = () => {
    navigation?.navigate('Debts', {
      screen: 'AddDebt',
      params: { mode: 'borrowing' }
    });
  };

  const handleViewAllDebts = (type: 'lending' | 'owing') => {
    navigation?.navigate('Debts', {
      screen: 'DebtsList',
      params: { filter: type }
    });
  };

  const handleSwitchMode = () => {
    Alert.alert(
      "Switch Mode",
      `Switch to ${isLender ? 'Borrower' : 'Lender'} view?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: () => {
            // This would update the user's view preference temporarily
            // You could implement this as a temporary state or save to settings
            Alert.alert("Feature Coming Soon", "Mode switching will be available in Settings");
          }
        }
      ]
    );
  };

  const renderLenderDashboard = () => (
    <VStack space="xl">
      {/* Header */}
      <VStack space="md">
        <HStack className="items-center justify-between">
          <VStack space="xs">
            <Text size="lg" className="text-typography-600">
              Welcome back,
            </Text>
            <Heading size="xl" className="text-typography-900">
              {user?.name || 'Lender'}
            </Heading>
          </VStack>
          <Pressable
            onPress={handleSwitchMode}
            className="px-3 py-2 bg-background-100 rounded-lg"
          >
            <Text size="sm" className="text-typography-600">
              Switch to Borrower
            </Text>
          </Pressable>
        </HStack>

        <Text size="md" className="text-typography-600">
          Manage your lending business
        </Text>
      </VStack>

      {/* Summary Cards */}
      <VStack space="md">
        <SummaryCard
          title="Total Owed to You"
          amount={summary.totalLending}
          count={lendingDebts.length}
          icon={DollarSign}
          variant="primary"
          onPress={() => handleViewAllDebts('lending')}
        />

        <HStack space="md">
          <Box className="flex-1">
            <SummaryCard
              title="Pending"
              amount={lendingDebts
                .filter(d => d.status === 'PENDING')
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={lendingDebts.filter(d => d.status === 'PENDING').length}
              icon={Clock}
              variant="secondary"
            />
          </Box>
          <Box className="flex-1">
            <SummaryCard
              title="Overdue"
              amount={lendingDebts
                .filter(d => d.status === 'OVERDUE')
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={lendingDebts.filter(d => d.status === 'OVERDUE').length}
              icon={AlertCircle}
              variant="warning"
            />
          </Box>
        </HStack>
      </VStack>

      {/* Quick Actions */}
      <VStack space="md">
        <Text size="lg" bold className="text-typography-900">
          Quick Actions
        </Text>

        <HStack space="md">
          <Box className="flex-1">
            <QuickAction
              title="Add New Loan"
              description="Record money you've lent"
              icon={Plus}
              onPress={handleAddLoan}
              variant="primary"
            />
          </Box>
          <Box className="flex-1">
            <QuickAction
              title="My Personal Debts"
              description="Track money you owe"
              icon={Users}
              onPress={() => handleViewAllDebts('owing')}
              variant="secondary"
            />
          </Box>
        </HStack>
      </VStack>

      {/* Secondary Summary for Personal Debts */}
      {owingDebts.length > 0 && (
        <VStack space="md">
          <Text size="md" className="text-typography-600">
            Your Personal Debts
          </Text>
          <SummaryCard
            title="Total You Owe"
            amount={summary.totalOwing}
            count={owingDebts.length}
            icon={Users}
            variant="secondary"
            onPress={() => handleViewAllDebts('owing')}
          />
        </VStack>
      )}
    </VStack>
  );

  const renderBorrowerDashboard = () => (
    <VStack space="xl">
      {/* Header */}
      <VStack space="md">
        <HStack className="items-center justify-between">
          <VStack space="xs">
            <Text size="lg" className="text-typography-600">
              Welcome back,
            </Text>
            <Heading size="xl" className="text-typography-900">
              {user?.name || 'User'}
            </Heading>
          </VStack>
          <Pressable
            onPress={handleSwitchMode}
            className="px-3 py-2 bg-background-100 rounded-lg"
          >
            <Text size="sm" className="text-typography-600">
              Switch to Lender
            </Text>
          </Pressable>
        </HStack>

        <Text size="md" className="text-typography-600">
          Track and manage your debts
        </Text>
      </VStack>

      {/* Summary Cards */}
      <VStack space="md">
        <SummaryCard
          title="Total You Owe"
          amount={summary.totalOwing}
          count={owingDebts.length}
          icon={ArrowDownLeft}
          variant="primary"
          onPress={() => handleViewAllDebts('owing')}
        />

        <HStack space="md">
          <Box className="flex-1">
            <SummaryCard
              title="Pending"
              amount={owingDebts
                .filter(d => d.status === 'PENDING')
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={owingDebts.filter(d => d.status === 'PENDING').length}
              icon={Clock}
              variant="secondary"
            />
          </Box>
          <Box className="flex-1">
            <SummaryCard
              title="Overdue"
              amount={owingDebts
                .filter(d => d.status === 'OVERDUE')
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={owingDebts.filter(d => d.status === 'OVERDUE').length}
              icon={AlertCircle}
              variant="warning"
            />
          </Box>
        </HStack>
      </VStack>

      {/* Quick Actions */}
      <VStack space="md">
        <Text size="lg" bold className="text-typography-900">
          Quick Actions
        </Text>

        <HStack space="md">
          <Box className="flex-1">
            <QuickAction
              title="Add a Debt"
              description="Track money you owe"
              icon={Plus}
              onPress={handleAddDebt}
              variant="primary"
            />
          </Box>
          <Box className="flex-1">
            <QuickAction
              title="My Lending"
              description="Money owed to you"
              icon={DollarSign}
              onPress={() => handleViewAllDebts('lending')}
              variant="secondary"
            />
          </Box>
        </HStack>
      </VStack>

      {/* Secondary Summary for Lending */}
      {lendingDebts.length > 0 && (
        <VStack space="md">
          <Text size="md" className="text-typography-600">
            Your Lending Business
          </Text>
          <SummaryCard
            title="Total Owed to You"
            amount={summary.totalLending}
            count={lendingDebts.length}
            icon={DollarSign}
            variant="secondary"
            onPress={() => handleViewAllDebts('lending')}
          />
        </VStack>
      )}
    </VStack>
  );

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Box className="px-6 py-8 pt-16">
          {isLender ? renderLenderDashboard() : renderBorrowerDashboard()}
        </Box>
      </ScrollView>

      {/* Floating Action Button */}
      <Box className="absolute bottom-6 right-6">
        <Pressable
          onPress={isLender ? handleAddLoan : handleAddDebt}
          className="w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        >
          <Icon as={Plus} size="lg" className="text-white" />
        </Pressable>
      </Box>
    </Box>
  );
}
