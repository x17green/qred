import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { MainTabParamList, DebtStackParamList } from '@/types';
import { COLORS } from '@/constants';
import { Text } from '@/components/ui/text';

// Placeholder screens - these would be implemented based on the full requirements
const DebtListScreen = () => (
  <Text className="flex-1 items-center justify-center">Debt List Screen</Text>
);

const DebtDetailScreen = () => (
  <Text className="flex-1 items-center justify-center">Debt Detail Screen</Text>
);

const AddDebtScreen = () => (
  <Text className="flex-1 items-center justify-center">Add Debt Screen</Text>
);

// Create stack navigator for debt screens
const DebtStack = createStackNavigator<DebtStackParamList>();

function DebtStackNavigator() {
  return (
    <DebtStack.Navigator
      initialRouteName="DebtsList"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.PRIMARY[600],
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <DebtStack.Screen
        name="DebtsList"
        component={DebtListScreen}
        options={{
          title: 'My Debts',
        }}
      />
      <DebtStack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{
          title: 'Debt Details',
        }}
      />
      <DebtStack.Screen
        name="AddDebt"
        component={AddDebtScreen}
        options={{
          title: 'Add New Debt',
        }}
      />
      <DebtStack.Screen
        name="EditDebt"
        component={AddDebtScreen}
        options={{
          title: 'Edit Debt',
        }}
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
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: COLORS.GRAY[200],
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Debts"
        component={DebtStackNavigator}
        options={{
          title: 'Debts',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>💳</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
