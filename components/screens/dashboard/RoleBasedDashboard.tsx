import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Card, CardBody } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { SemanticColors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/store/authStore";
import { useDebtActions, useDebts } from "@/lib/store/debtStore";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Clock, DollarSign, Plus, TrendingUp, Users } from "lucide-react-native";
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
  variant: "primary" | "secondary" | "success" | "warning" | "lending" | "borrowing";
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function SummaryCard({ title, amount, count, icon, variant, onPress, trend }: SummaryCardProps) {
  const variantStyles = {
    primary: {
      card: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
      titleColor: "text-blue-700",
      amountColor: "text-blue-900",
      shadow: "shadow-blue-100",
    },
    secondary: {
      card: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
      iconBg: "bg-gray-500",
      iconColor: "text-white",
      titleColor: "text-gray-700",
      amountColor: "text-gray-900",
      shadow: "shadow-gray-100",
    },
    success: {
      card: "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200",
      iconBg: "bg-green-500",
      iconColor: "text-white",
      titleColor: "text-green-700",
      amountColor: "text-green-900",
      shadow: "shadow-green-100",
    },
    warning: {
      card: "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
      titleColor: "text-amber-700",
      amountColor: "text-amber-900",
      shadow: "shadow-amber-100",
    },
    lending: {
      card: "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200",
      iconBg: "bg-emerald-600",
      iconColor: "text-white",
      titleColor: "text-emerald-700",
      amountColor: "text-emerald-900",
      shadow: "shadow-emerald-100",
    },
    borrowing: {
      card: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200",
      iconBg: "bg-orange-500",
      iconColor: "text-white",
      titleColor: "text-orange-700",
      amountColor: "text-orange-900",
      shadow: "shadow-orange-100",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card variant="elevated" className={`${styles.card} ${styles.shadow} border-l-4`}>
      <Pressable onPress={onPress} className="p-0">
        <CardBody className="p-4">
          <HStack space="md" className="items-center">
            <Box className={`w-14 h-14 rounded-2xl ${styles.iconBg} items-center justify-center shadow-md`}>
              <Icon as={icon} size="lg" className={styles.iconColor} />
            </Box>

            <VStack space="xs" className="flex-1">
              <HStack className="items-center justify-between">
                <Text size="sm" className={`${styles.titleColor} font-medium`}>
                  {title}
                </Text>
                {trend && (
                  <Badge action={trend.isPositive ? "success" : "error"} size="sm" variant="outline">
                    <BadgeIcon as={TrendingUp} />
                    <BadgeText>{trend.isPositive ? "+" : ""}{trend.value}%</BadgeText>
                  </Badge>
                )}
              </HStack>

              <Heading size="xl" className={styles.amountColor}>
                ₦{amount.toLocaleString()}
              </Heading>

              <HStack space="xs" className="items-center">
                <Text size="xs" className="text-typography-500">
                  {count} {count === 1 ? 'debt' : 'debts'}
                </Text>
                {onPress && (
                  <Icon as={ArrowUpRight} size="xs" className="text-typography-400" />
                )}
              </HStack>
            </VStack>
          </HStack>
        </CardBody>
      </Pressable>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

interface RecentActivityItemProps {
  debt: any;
  userRole: 'LENDER' | 'BORROWER';
  onPress?: () => void;
}

function RecentActivityItem({ debt, userRole, onPress }: RecentActivityItemProps) {
  const isLender = userRole === 'LENDER';
  const otherParty = isLender
    ? (debt.debtor?.name || debt.debtorName || debt.debtorPhoneNumber)
    : (debt.externalLenderName || debt.lender?.name || 'Unknown Lender');

  const statusColor = debt.status === 'PAID' ? 'text-green-600'
    : debt.status === 'OVERDUE' ? 'text-red-600'
    : 'text-amber-600';

  return (
    <Card variant="outline" className="overflow-hidden">
      <Pressable onPress={onPress} className="p-0">
        <CardBody className="p-4">
          <HStack space="md" className="items-center">
            <Avatar size="sm" className={`${isLender ? 'bg-emerald-100' : 'bg-orange-100'}`}>
              <AvatarFallbackText>{otherParty}</AvatarFallbackText>
            </Avatar>

            <VStack space="xs" className="flex-1">
              <HStack className="items-center justify-between">
                <Text size="sm" bold className="text-typography-900">
                  {otherParty}
                </Text>
                <Badge
                  action={debt.status === 'PAID' ? 'success' : debt.status === 'OVERDUE' ? 'error' : 'warning'}
                  size="sm"
                  variant="outline"
                >
                  <BadgeText>{debt.status}</BadgeText>
                </Badge>
              </HStack>

              <HStack className="items-center justify-between">
                <Text size="xs" className="text-typography-500">
                  {isLender ? 'owes you' : 'you owe'} ₦{debt.outstandingBalance.toLocaleString()}
                </Text>
                <Text size="xs" className="text-typography-400">
                  {new Date(debt.createdAt).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>

            <Icon as={ArrowUpRight} size="xs" className="text-typography-400" />
          </HStack>
        </CardBody>
      </Pressable>
    </Card>
  );
}

function QuickAction({ title, description, icon, onPress, variant = "primary" }: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <Card variant="outline" className={`overflow-hidden ${isPrimary ? 'border-primary-200' : 'border-gray-200'}`}>
      <Pressable onPress={onPress} className="p-0">
        <CardBody className="p-6">
          <VStack space="md" className="items-center">
            <Box
              className={`
                w-20 h-20 rounded-2xl items-center justify-center shadow-lg
                ${isPrimary
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }
              `}
            >
              <Icon
                as={icon}
                size="xl"
                className={isPrimary ? 'text-white' : 'text-gray-600'}
              />
            </Box>

            <VStack space="xs" className="items-center">
              <Heading
                size="md"
                className={`text-center ${isPrimary ? 'text-primary-700' : 'text-typography-700'}`}
              >
                {title}
              </Heading>
              <Text
                size="sm"
                className={`text-center max-w-[120px] ${isPrimary ? 'text-primary-600' : 'text-typography-500'}`}
              >
                {description}
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Pressable>
    </Card>
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

  // Get recent activities (recent debts from both lending and owing)
  const recentActivities = [...lendingDebts, ...owingDebts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
      {/* Enhanced Header with Avatar */}
      <Card variant="filled" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
        <CardBody className="p-6">
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Avatar size="lg" className="border-2 border-white shadow-md">
                <AvatarFallbackText>{user?.name || 'LN'}</AvatarFallbackText>
                {user?.avatarUrl && (
                  <AvatarImage source={{ uri: user.avatarUrl }} />
                )}
              </Avatar>

              <VStack space="xs" className="flex-1">
                <Text size="sm" className="text-blue-600 font-medium">
                  Welcome back,
                </Text>
                <Heading size="xl" className="text-blue-900">
                  {user?.name || 'Lender'}
                </Heading>
                <HStack space="xs" className="items-center">
                  <Badge action="primary" size="sm" variant="solid">
                    <BadgeText>Lender Mode</BadgeText>
                  </Badge>
                  <Text size="sm" className="text-blue-600">
                    • Manage your lending business
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <Pressable
              onPress={handleSwitchMode}
              className="px-4 py-2 bg-white rounded-lg shadow-sm border border-blue-200"
            >
              <Text size="sm" className="text-blue-700 font-medium">
                Switch Mode
              </Text>
            </Pressable>
          </HStack>
        </CardBody>
      </Card>

      {/* Enhanced Summary Cards */}
      <VStack space="lg">
        <Heading size="lg" className="text-typography-900">
          Lending Overview
        </Heading>

        <SummaryCard
          title="Total Owed to You"
          amount={summary.totalLending}
          count={lendingDebts.length}
          icon={DollarSign}
          variant="lending"
          onPress={() => handleViewAllDebts('lending')}
          trend={{ value: 12.5, isPositive: true }}
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

      {/* Enhanced Quick Actions */}
      <VStack space="lg">
        <Heading size="lg" className="text-typography-900">
          Quick Actions
        </Heading>

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
              title="Personal Debts"
              description="Track money you owe"
              icon={Users}
              onPress={() => handleViewAllDebts('owing')}
              variant="secondary"
            />
          </Box>
        </HStack>
      </VStack>

      {/* Recent Activities Section */}
      <VStack space="lg">
        <HStack className="items-center justify-between">
          <Heading size="lg" className="text-typography-900">
            Recent Activities
          </Heading>
          <Pressable onPress={() => navigation?.navigate('Debts')}>
            <Text size="sm" className="text-primary-600 font-medium">
              View All
            </Text>
          </Pressable>
        </HStack>

        {recentActivities.length > 0 ? (
          <VStack space="sm">
            {recentActivities.map((debt) => (
              <RecentActivityItem
                key={debt.id}
                debt={debt}
                userRole="LENDER"
                onPress={() => navigation?.navigate('Debts', {
                  screen: 'DebtDetail',
                  params: { debtId: debt.id }
                })}
              />
            ))}
          </VStack>
        ) : (
          <Card variant="outline" className="bg-gray-50">
            <CardBody className="p-6 items-center">
              <Icon as={Clock} size="xl" className="text-gray-400 mb-2" />
              <Text size="sm" className="text-gray-600 text-center">
                No recent activities
              </Text>
              <Text size="xs" className="text-gray-500 text-center mt-1">
                Your lending activities will appear here
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Secondary Summary for Personal Debts */}
      {owingDebts.length > 0 && (
        <VStack space="md">
          <Heading size="md" className="text-typography-700">
            Your Personal Debts
          </Heading>
          <SummaryCard
            title="Total You Owe"
            amount={summary.totalOwing}
            count={owingDebts.length}
            icon={ArrowDownLeft}
            variant="borrowing"
            onPress={() => handleViewAllDebts('owing')}
          />
        </VStack>
      )}
    </VStack>
  );

  const renderBorrowerDashboard = () => (
    <VStack space="xl">
      {/* Enhanced Header with Avatar */}
      <Card variant="filled" className="bg-gradient-to-r from-orange-50 to-amber-50 border-0">
        <CardBody className="p-6">
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Avatar size="lg" className="border-2 border-white shadow-md">
                <AvatarFallbackText>{user?.name || 'BR'}</AvatarFallbackText>
                {user?.avatarUrl && (
                  <AvatarImage source={{ uri: user.avatarUrl }} />
                )}
              </Avatar>

              <VStack space="xs" className="flex-1">
                <Text size="sm" className="text-orange-600 font-medium">
                  Welcome back,
                </Text>
                <Heading size="xl" className="text-orange-900">
                  {user?.name || 'User'}
                </Heading>
                <HStack space="xs" className="items-center">
                  <Badge action="warning" size="sm" variant="solid">
                    <BadgeText>Borrower Mode</BadgeText>
                  </Badge>
                  <Text size="sm" className="text-orange-600">
                    • Track and manage your debts
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <Pressable
              onPress={handleSwitchMode}
              className="px-4 py-2 bg-white rounded-lg shadow-sm border border-orange-200"
            >
              <Text size="sm" className="text-orange-700 font-medium">
                Switch Mode
              </Text>
            </Pressable>
          </HStack>
        </CardBody>
      </Card>

      {/* Enhanced Summary Cards */}
      <VStack space="lg">
        <Heading size="lg" className="text-typography-900">
          Debt Overview
        </Heading>

        <SummaryCard
          title="Total You Owe"
          amount={summary.totalOwing}
          count={owingDebts.length}
          icon={ArrowDownLeft}
          variant="borrowing"
          onPress={() => handleViewAllDebts('owing')}
          trend={{ value: -8.2, isPositive: false }}
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

      {/* Enhanced Quick Actions */}
      <VStack space="lg">
        <Heading size="lg" className="text-typography-900">
          Quick Actions
        </Heading>

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

      {/* Recent Activities Section */}
      <VStack space="lg">
        <HStack className="items-center justify-between">
          <Heading size="lg" className="text-typography-900">
            Recent Activities
          </Heading>
          <Pressable onPress={() => navigation?.navigate('Debts')}>
            <Text size="sm" className="text-primary-600 font-medium">
              View All
            </Text>
          </Pressable>
        </HStack>

        {recentActivities.length > 0 ? (
          <VStack space="sm">
            {recentActivities.map((debt) => (
              <RecentActivityItem
                key={debt.id}
                debt={debt}
                userRole="BORROWER"
                onPress={() => navigation?.navigate('Debts', {
                  screen: 'DebtDetail',
                  params: { debtId: debt.id }
                })}
              />
            ))}
          </VStack>
        ) : (
          <Card variant="outline" className="bg-gray-50">
            <CardBody className="p-6 items-center">
              <Icon as={Clock} size="xl" className="text-gray-400 mb-2" />
              <Text size="sm" className="text-gray-600 text-center">
                No recent activities
              </Text>
              <Text size="xs" className="text-gray-500 text-center mt-1">
                Your debt activities will appear here
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Secondary Summary for Lending */}
      {lendingDebts.length > 0 && (
        <VStack space="md">
          <Heading size="md" className="text-typography-700">
            Your Lending Business
          </Heading>
          <SummaryCard
            title="Total Owed to You"
            amount={summary.totalLending}
            count={lendingDebts.length}
            icon={DollarSign}
            variant="lending"
            onPress={() => handleViewAllDebts('lending')}
          />
        </VStack>
      )}
    </VStack>
  );

  return (
    <Box className="flex-1 bg-gradient-to-b from-background-0 to-background-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isLender ? SemanticColors.lending : SemanticColors.borrowing}
          />
        }
      >
        <Box className="px-6 py-8 pt-16 pb-24">
          {isLender ? renderLenderDashboard() : renderBorrowerDashboard()}
        </Box>
      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <Box className="absolute bottom-8 right-6">
        <Pressable
          onPress={isLender ? handleAddLoan : handleAddDebt}
          className={`
            w-16 h-16 rounded-2xl items-center justify-center shadow-2xl
            ${isLender
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-orange-500 to-amber-500'
            }
          `}
        >
          <Icon as={Plus} size="xl" className="text-white" />
        </Pressable>
      </Box>
    </Box>
  );
}
