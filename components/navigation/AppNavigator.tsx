import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthStack from "./AuthStack";
import MainTabNavigator from "./MainTabNavigator";
import { useAuth, useAuthActions } from "@/lib/store/authStore";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { RootStackParamList } from "@/lib/types";

const Stack = createStackNavigator<RootStackParamList>();

// Loading screen component
function LoadingScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-0">
      <Text size="lg" className="text-primary-600 font-semibold">
        Loading...
      </Text>
    </Box>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { checkAuthStatus } = useAuthActions();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error("App initialization error:", error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading screen while initializing
  if (isInitializing || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{
              animationTypeForReplace: "push",
            }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{
              animationTypeForReplace: "pop",
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
