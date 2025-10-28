import LoginScreen from "@/components/screens/auth/LoginScreen";
import OTPScreen from "@/components/screens/auth/OTPScreen";
import OnboardingScreen from "@/components/screens/auth/OnboardingScreen";
import SignUpScreen from "@/components/screens/auth/SignUpScreen";
import { AuthStackParamList } from "@/types";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import DebugScreen from "../screens/debug/DebugScreen";
import AuthTestScreen from "../screens/test/AuthTestScreen";

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
        name="SignUp"
        component={SignUpScreen}
        options={{
          title: "Create Account",
          gestureDirection: "horizontal",
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
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          title: "Complete Profile",
          gestureDirection: "horizontal",
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
