import DashboardScreen from '@/components/screens/dashboard/DashboardScreen';
import AddDebtScreen from '@/components/screens/debts/AddDebtScreen';
import DebtDetailScreen from '@/components/screens/debts/DebtDetailScreen';
import DebtsListScreen from '@/components/screens/debts/DebtsListScreen';
import EditDebtScreen from '@/components/screens/debts/EditDebtScreen';
import ProfileScreen from '@/components/screens/profile/ProfileScreen';
import { COLORS } from '@/lib/constants';
import { DebtStackParamList, MainTabParamList } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

// Create stack navigator for debt screens
const DebtStack = createStackNavigator<DebtStackParamList>();

function DebtStackNavigator() {
  return (
    <DebtStack.Navigator
      initialRouteName="DebtsList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <DebtStack.Screen
        name="DebtsList"
        component={DebtsListScreen}
      />
      <DebtStack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
      />
      <DebtStack.Screen
        name="AddDebt"
        component={AddDebtScreen}
      />
      <DebtStack.Screen
        name="EditDebt"
        component={EditDebtScreen}
      />
    </DebtStack.Navigator>
  );
}

// Create bottom tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY[600],
        tabBarInactiveTintColor: COLORS.GRAY[500],
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: COLORS.GRAY[200],
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Debts"
        component={DebtStackNavigator}
        options={{
          title: "Debts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
