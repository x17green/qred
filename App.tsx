import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "@/components/navigation/AppNavigator";
import { authService } from "@/lib/services/authService";
import { supabase } from "@/lib/services/supabase";
import { useAuthStore } from "@/lib/store/authStore";
import "./global.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export default function App() {
  const { setAuthUser, setToken, reset } = useAuthStore();

  React.useEffect(() => {
    // Initialize auth service on app start
    authService.initialize();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Qred Auth Event:", event, session?.user?.id);

      if (event === "SIGNED_IN" && session) {
        setAuthUser(session.user);
        setToken(session.access_token);

        // Get or create user profile
        try {
          const userProfile = await authService.getStoredUser();
          if (userProfile) {
            console.log("Qred: User profile loaded");
          }
        } catch (error) {
          console.log("Qred: User profile not found or error loading");
        }
      } else if (event === "SIGNED_OUT") {
        reset();
        console.log("Qred: User signed out");
      }
    });

    return () => subscription?.unsubscribe();
  }, [setAuthUser, setToken, reset]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <AppNavigator />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
