import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "@/screens/auth/LoginScreen";
import OTPScreen from "@/screens/auth/OTPScreen";
import { AuthStackParamList } from "@/types";

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
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
    </Stack.Navigator>
  );
}
