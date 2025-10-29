"use client"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Icon } from "@/components/ui/icon"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { QredColors, SemanticColors } from "@/lib/constants/colors"
import { useAuth } from "@/lib/store/authStore"
import { useDebtActions, useDebts } from "@/lib/store/debtStore"
import { LinearGradient } from "expo-linear-gradient"
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    DollarSign,
    Plus,
    TrendingUp,
    Users,
} from "lucide-react-native"
import type React from "react"
import { useEffect, useState } from "react"
import { Alert, Image, RefreshControl, ScrollView } from "react-native"

interface DashboardProps {
  navigation?: any
}

interface SummaryCardProps {
  title: string
  amount: number
  count: number
  icon: React.ComponentType<any>
  variant: "primary" | "secondary" | "success" | "warning" | "lending" | "borrowing"
  onPress?: () => void
  trend?: {
    value: number
    isPositive: boolean
  }
}

function SummaryCard({ title, amount, count, icon, variant, onPress, trend }: SummaryCardProps) {
  const variantStyles = {
    primary: {
      gradientColors: [QredColors.brand.navy, QredColors.brand.navyDark],
      iconBg: QredColors.brand.navy,
      titleColor: "text-white/80",
      amountColor: "text-white",
      countColor: "text-white/70",
    },
    secondary: {
      gradientColors: [QredColors.surface.card, QredColors.surface.elevated],
      iconBg: QredColors.text.tertiary,
      titleColor: "text-typography-600",
      amountColor: "text-typography-900",
      countColor: "text-typography-500",
    },
    success: {
      gradientColors: [QredColors.accent.green, QredColors.accent.greenDark],
      iconBg: QredColors.accent.green,
      titleColor: "text-white/80",
      amountColor: "text-white",
      countColor: "text-white/70",
    },
    warning: {
      gradientColors: [QredColors.status.warning[500], QredColors.status.warning[600]],
      iconBg: QredColors.status.warning[500],
      titleColor: "text-white/80",
      amountColor: "text-white",
      countColor: "text-white/70",
    },
    lending: {
      gradientColors: [QredColors.accent.green, QredColors.accent.greenDark],
      iconBg: QredColors.accent.green,
      titleColor: "text-white/80",
      amountColor: "text-white",
      countColor: "text-white/70",
    },
    borrowing: {
      gradientColors: [QredColors.status.warning[500], QredColors.status.warning[600]],
      iconBg: QredColors.status.warning[500],
      titleColor: "text-white/80",
      amountColor: "text-white",
      countColor: "text-white/70",
    },
  }

  const styles = variantStyles[variant]

  return (
    <Pressable onPress={onPress} className="rounded-2xl overflow-hidden">
      <Box
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={styles.gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, padding: 20 }}
        >
          <HStack space="md" className="items-start">
            <Box
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <Icon as={icon} size="lg" className="text-white" />
            </Box>

            <VStack space="xs" className="flex-1">
              <HStack className="items-center justify-between">
                <Text size="sm" className={`${styles.titleColor} font-medium`}>
                  {title}
                </Text>
                {trend && (
                  <Box
                    className="px-2 py-1 rounded-md flex-row items-center gap-1"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  >
                    <Icon
                      as={TrendingUp}
                      size="xs"
                      className="text-white"
                      style={{ transform: [{ rotate: trend.isPositive ? "0deg" : "180deg" }] }}
                    />
                    <Text size="xs" className="text-white font-semibold">
                      {trend.isPositive ? "+" : ""}
                      {trend.value}%
                    </Text>
                  </Box>
                )}
              </HStack>

              <Heading size="2xl" className={`${styles.amountColor} font-bold`}>
                ₦{amount.toLocaleString()}
              </Heading>

              <HStack space="xs" className="items-center">
                <Text size="xs" className={styles.countColor}>
                  {count} {count === 1 ? "debt" : "debts"}
                </Text>
                {onPress && <Icon as={ArrowUpRight} size="xs" className="text-white/60" />}
              </HStack>
            </VStack>
          </HStack>
        </LinearGradient>
      </Box>
    </Pressable>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  onPress: () => void
  variant?: "primary" | "secondary"
}

interface RecentActivityItemProps {
  debt: any
  userRole: "LENDER" | "BORROWER"
  onPress?: () => void
}

function RecentActivityItem({ debt, userRole, onPress }: RecentActivityItemProps) {
  const isLender = userRole === "LENDER"
  const otherParty = isLender
    ? debt.debtor?.name || debt.debtorName || debt.debtorPhoneNumber
    : debt.externalLenderName || debt.lender?.name || "Unknown Lender"

  const statusConfig = {
    PAID: { color: QredColors.status.success[600], bg: "bg-green-50", text: "text-green-700" },
    OVERDUE: { color: QredColors.status.error[600], bg: "bg-red-50", text: "text-red-700" },
    PENDING: { color: QredColors.status.warning[600], bg: "bg-amber-50", text: "text-amber-700" },
  }

  const config = statusConfig[debt.status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <Pressable onPress={onPress}>
      <Box
        className="bg-white rounded-2xl p-4 border border-background-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <HStack space="md" className="items-center">
          <Box
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: isLender ? QredColors.status.success[50] : QredColors.status.warning[50] }}
          >
            <Text
              className="text-lg font-bold"
              style={{ color: isLender ? QredColors.accent.green : QredColors.status.warning[600] }}
            >
              {otherParty.charAt(0).toUpperCase()}
            </Text>
          </Box>

          <VStack space="xs" className="flex-1">
            <HStack className="items-center justify-between">
              <Text size="sm" className="font-bold text-typography-900">
                {otherParty}
              </Text>
              <Box className={`px-2 py-1 rounded-lg ${config.bg}`}>
                <Text size="xs" className={`font-semibold ${config.text}`}>
                  {debt.status}
                </Text>
              </Box>
            </HStack>

            <HStack className="items-center justify-between">
              <Text size="sm" className="font-semibold text-typography-700">
                ₦{debt.outstandingBalance.toLocaleString()}
              </Text>
              <Text size="xs" className="text-typography-400">
                {new Date(debt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </HStack>
          </VStack>

          <Icon as={ArrowUpRight} size="sm" className="text-typography-300" />
        </HStack>
      </Box>
    </Pressable>
  )
}

function QuickAction({ title, description, icon, onPress, variant = "primary" }: QuickActionProps) {
  const isPrimary = variant === "primary"

  return (
    <Pressable onPress={onPress}>
      <Box
        className="bg-white rounded-2xl p-6 border border-background-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <VStack space="md" className="items-center">
          <Box
            className="w-16 h-16 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: isPrimary ? QredColors.brand.navy : QredColors.surface.elevated,
            }}
          >
            <Icon as={icon} size="xl" className={isPrimary ? "text-white" : "text-typography-600"} />
          </Box>

          <VStack space="xs" className="items-center">
            <Text size="md" className="font-bold text-typography-900 text-center">
              {title}
            </Text>
            <Text size="sm" className="text-typography-500 text-center">
              {description}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Pressable>
  )
}

export default function RoleBasedDashboard({ navigation }: DashboardProps) {
  const { user } = useAuth()
  const { lendingDebts, owingDebts, isLoading } = useDebts()
  const { fetchAllDebts } = useDebtActions()

  const [refreshing, setRefreshing] = useState(false)

  const userRole = user?.defaultRole || "BORROWER"
  const isLender = userRole === "LENDER"

  useEffect(() => {
    if (user?.id) {
      fetchAllDebts()
    }
  }, [user?.id, fetchAllDebts])

  const summary = {
    totalLending: lendingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0),
    totalOwing: owingDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0),
  }

  const recentActivities = [...lendingDebts, ...owingDebts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchAllDebts()
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddLoan = () => {
    navigation?.navigate("Debts", {
      screen: "AddDebt",
      params: { mode: "lending" },
    })
  }

  const handleAddDebt = () => {
    navigation?.navigate("Debts", {
      screen: "AddDebt",
      params: { mode: "borrowing" },
    })
  }

  const handleViewAllDebts = (type: "lending" | "owing") => {
    navigation?.navigate("Debts", {
      screen: "DebtsList",
      params: { filter: type },
    })
  }

  const handleSwitchMode = () => {
    Alert.alert("Switch Mode", `Switch to ${isLender ? "Borrower" : "Lender"} view?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        onPress: () => {
          Alert.alert("Feature Coming Soon", "Mode switching will be available in Settings")
        },
      },
    ])
  }

  const renderLenderDashboard = () => (
    <VStack space="xl">
      <Box className="rounded-3xl overflow-hidden">
        <LinearGradient
          colors={[QredColors.brand.navy, QredColors.brand.navyDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24, borderRadius: 24 }}
        >
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Box
                className="w-16 h-16 rounded-2xl items-center justify-center border-2 border-white/20"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-2xl font-bold text-white">{(user?.name || "LN").charAt(0).toUpperCase()}</Text>
                )}
              </Box>

              <VStack space="xs" className="flex-1">
                <Text size="sm" className="text-white/70 font-medium">
                  Welcome back,
                </Text>
                <Heading size="xl" className="text-white font-bold">
                  {user?.name || "Lender"}
                </Heading>
                <Box className="px-3 py-1 rounded-lg self-start" style={{ backgroundColor: QredColors.accent.green }}>
                  <Text size="xs" className="text-white font-bold">
                    LENDER MODE
                  </Text>
                </Box>
              </VStack>
            </HStack>
          </HStack>
        </LinearGradient>
      </Box>

      <VStack space="lg">
        <Heading size="lg" className="text-typography-900 font-bold">
          Lending Overview
        </Heading>

        <SummaryCard
          title="Total Owed to You"
          amount={summary.totalLending}
          count={lendingDebts.length}
          icon={DollarSign}
          variant="lending"
          onPress={() => handleViewAllDebts("lending")}
          trend={{ value: 12.5, isPositive: true }}
        />

        <HStack space="md">
          <Box className="flex-1">
            <SummaryCard
              title="Pending"
              amount={lendingDebts
                .filter((d) => d.status === "PENDING")
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={lendingDebts.filter((d) => d.status === "PENDING").length}
              icon={Clock}
              variant="secondary"
            />
          </Box>
          <Box className="flex-1">
            <SummaryCard
              title="Overdue"
              amount={lendingDebts
                .filter((d) => d.status === "OVERDUE")
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={lendingDebts.filter((d) => d.status === "OVERDUE").length}
              icon={AlertCircle}
              variant="warning"
            />
          </Box>
        </HStack>
      </VStack>

      <VStack space="lg">
        <Heading size="lg" className="text-typography-900 font-bold">
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
              onPress={() => handleViewAllDebts("owing")}
              variant="secondary"
            />
          </Box>
        </HStack>
      </VStack>

      <VStack space="lg">
        <HStack className="items-center justify-between">
          <Heading size="lg" className="text-typography-900 font-bold">
            Recent Activities
          </Heading>
          <Pressable onPress={() => navigation?.navigate("Debts")}>
            <Text size="sm" className="font-bold" style={{ color: QredColors.brand.navy }}>
              View All →
            </Text>
          </Pressable>
        </HStack>

        {recentActivities.length > 0 ? (
          <VStack space="md">
            {recentActivities.map((debt) => (
              <RecentActivityItem
                key={debt.id}
                debt={debt}
                userRole="LENDER"
                onPress={() =>
                  navigation?.navigate("Debts", {
                    screen: "DebtDetail",
                    params: { debtId: debt.id },
                  })
                }
              />
            ))}
          </VStack>
        ) : (
          <Box
            className="bg-white rounded-2xl p-8 items-center border border-background-200"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Box
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: QredColors.surface.elevated }}
            >
              <Icon as={Clock} size="xl" className="text-typography-400" />
            </Box>
            <Text size="sm" className="text-typography-600 text-center font-semibold">
              No recent activities
            </Text>
            <Text size="xs" className="text-typography-400 text-center mt-2">
              Your lending activities will appear here
            </Text>
          </Box>
        )}
      </VStack>

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
            onPress={() => handleViewAllDebts("owing")}
          />
        </VStack>
      )}
    </VStack>
  )

  const renderBorrowerDashboard = () => (
    <VStack space="xl">
      <Box className="rounded-3xl overflow-hidden">
        <LinearGradient
          colors={[QredColors.status.warning[500], QredColors.status.warning[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24, borderRadius: 24 }}
        >
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Box
                className="w-16 h-16 rounded-2xl items-center justify-center border-2 border-white/20"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-2xl font-bold text-white">{(user?.name || "BR").charAt(0).toUpperCase()}</Text>
                )}
              </Box>

              <VStack space="xs" className="flex-1">
                <Text size="sm" className="text-white/70 font-medium">
                  Welcome back,
                </Text>
                <Heading size="xl" className="text-white font-bold">
                  {user?.name || "User"}
                </Heading>
                <Box
                  className="px-3 py-1 rounded-lg self-start"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <Text size="xs" className="text-white font-bold">
                    BORROWER MODE
                  </Text>
                </Box>
              </VStack>
            </HStack>
          </HStack>
        </LinearGradient>
      </Box>

      <VStack space="lg">
        <Heading size="lg" className="text-typography-900 font-bold">
          Debt Overview
        </Heading>

        <SummaryCard
          title="Total You Owe"
          amount={summary.totalOwing}
          count={owingDebts.length}
          icon={ArrowDownLeft}
          variant="borrowing"
          onPress={() => handleViewAllDebts("owing")}
          trend={{ value: -8.2, isPositive: false }}
        />

        <HStack space="md">
          <Box className="flex-1">
            <SummaryCard
              title="Pending"
              amount={owingDebts
                .filter((d) => d.status === "PENDING")
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={owingDebts.filter((d) => d.status === "PENDING").length}
              icon={Clock}
              variant="secondary"
            />
          </Box>
          <Box className="flex-1">
            <SummaryCard
              title="Overdue"
              amount={owingDebts
                .filter((d) => d.status === "OVERDUE")
                .reduce((sum, d) => sum + d.outstandingBalance, 0)}
              count={owingDebts.filter((d) => d.status === "OVERDUE").length}
              icon={AlertCircle}
              variant="warning"
            />
          </Box>
        </HStack>
      </VStack>

      <VStack space="lg">
        <Heading size="lg" className="text-typography-900 font-bold">
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
              onPress={() => handleViewAllDebts("lending")}
              variant="secondary"
            />
          </Box>
        </HStack>
      </VStack>

      <VStack space="lg">
        <HStack className="items-center justify-between">
          <Heading size="lg" className="text-typography-900 font-bold">
            Recent Activities
          </Heading>
          <Pressable onPress={() => navigation?.navigate("Debts")}>
            <Text size="sm" className="font-bold" style={{ color: QredColors.brand.navy }}>
              View All →
            </Text>
          </Pressable>
        </HStack>

        {recentActivities.length > 0 ? (
          <VStack space="md">
            {recentActivities.map((debt) => (
              <RecentActivityItem
                key={debt.id}
                debt={debt}
                userRole="BORROWER"
                onPress={() =>
                  navigation?.navigate("Debts", {
                    screen: "DebtDetail",
                    params: { debtId: debt.id },
                  })
                }
              />
            ))}
          </VStack>
        ) : (
          <Box
            className="bg-white rounded-2xl p-8 items-center border border-background-200"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Box
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: QredColors.surface.elevated }}
            >
              <Icon as={Clock} size="xl" className="text-typography-400" />
            </Box>
            <Text size="sm" className="text-typography-600 text-center font-semibold">
              No recent activities
            </Text>
            <Text size="xs" className="text-typography-400 text-center mt-2">
              Your debt activities will appear here
            </Text>
          </Box>
        )}
      </VStack>

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
            onPress={() => handleViewAllDebts("lending")}
          />
        </VStack>
      )}
    </VStack>
  )

  return (
    <Box className="flex-1" style={{ backgroundColor: QredColors.background.light }}>
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
        <Box className="px-6 py-8 pt-16 pb-24">{isLender ? renderLenderDashboard() : renderBorrowerDashboard()}</Box>
      </ScrollView>

      <Box className="absolute bottom-8 right-6">
        <Pressable
          onPress={isLender ? handleAddLoan : handleAddDebt}
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: isLender ? QredColors.accent.green : QredColors.status.warning[500],
            alignItems: "center",
            justifyContent: "center",
            shadowColor: isLender ? QredColors.accent.green : QredColors.status.warning[500],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Icon as={Plus} size="xl" className="text-white" />
        </Pressable>
      </Box>
    </Box>
  )
}
