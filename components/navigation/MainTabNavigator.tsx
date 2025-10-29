import DashboardScreen from "@/components/screens/dashboard/DashboardScreen"
import AddDebtScreen from "@/components/screens/debts/AddDebtScreen"
import DebtDetailScreen from "@/components/screens/debts/DebtDetailScreen"
import DebtsListScreen from "@/components/screens/debts/DebtsListScreen"
import EditDebtScreen from "@/components/screens/debts/EditDebtScreen"
import RecordPaymentScreen from "@/components/screens/debts/RecordPaymentScreen"
import ProfileScreen from "@/components/screens/profile/ProfileScreen"
import { QredColors } from "@/lib/constants/colors"
import type { DebtStackParamList, MainTabParamList } from "@/lib/types"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Home, User, Wallet } from "lucide-react-native"

// Create stack navigator for debt screens
const DebtStack = createStackNavigator<DebtStackParamList>()

function DebtStackNavigator() {
  return (
    <DebtStack.Navigator
      initialRouteName="DebtsList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <DebtStack.Screen name="DebtsList" component={DebtsListScreen} />
      <DebtStack.Screen name="DebtDetail" component={DebtDetailScreen} />
      <DebtStack.Screen name="AddDebt" component={AddDebtScreen} />
      <DebtStack.Screen name="EditDebt" component={EditDebtScreen} />
      <DebtStack.Screen name="RecordPayment" component={RecordPaymentScreen} />
    </DebtStack.Navigator>
  )
}

// Create bottom tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: QredColors.brand.navy,
        tabBarInactiveTintColor: QredColors.text.tertiary,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          paddingVertical: 8,
          paddingBottom: 12,
          height: 70,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen
        name="Debts"
        component={DebtStackNavigator}
        options={{
          title: "Debts",
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
    </Tab.Navigator>
  )
}
