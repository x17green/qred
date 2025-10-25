import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "@/components/screens/auth/LoginScreen";
import OTPScreen from "@/components/screens/auth/OTPScreen";
import AuthTestScreen from "../screens/test/AuthTestScreen";
import DebugScreen from "../screens/debug/DebugScreen";
import { AuthStackParamList } from "@/types";

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login" // Change to "Debug" for testing
      screenOptions={{
        headerShown: true,
        cardStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Sign In",
        }}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{
          title: "Verify OTP",
          gestureDirection: "horizontal", // Standard horizontal gesture
        }}
      />
      <Stack.Screen
        name="Test"
        component={AuthTestScreen}
        options={{
          title: "Test Authentication",
          gestureDirection: "horizontal", // Standard horizontal gesture
        }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{
          title: "Debug Environment",
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}
