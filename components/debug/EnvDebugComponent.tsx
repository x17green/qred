import React from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { API_CONFIG, PAYMENT_CONFIG } from '@/lib/constants';

export default function EnvDebugComponent() {
  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="p-4">
        <VStack space="lg">
          {/* Header */}
          <Text size="2xl" className="font-bold text-center text-typography-900">
            🧪 Environment Variables Debug
          </Text>

          {/* API Configuration */}
          <Box className="bg-background-50 p-4 rounded-lg">
            <Text size="lg" className="font-semibold text-typography-800 mb-2">
              📡 API Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-typography-600">
                BASE_URL: {API_CONFIG.BASE_URL}
              </Text>
              <Text size="sm" className="text-typography-600">
                TIMEOUT: {API_CONFIG.TIMEOUT}ms
              </Text>
              <Text size="sm" className="text-typography-600">
                RETRY_ATTEMPTS: {API_CONFIG.RETRY_ATTEMPTS}
              </Text>
            </VStack>
          </Box>

          {/* Payment Configuration */}
          <Box className="bg-background-50 p-4 rounded-lg">
            <Text size="lg" className="font-semibold text-typography-800 mb-2">
              💳 Payment Configuration
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-typography-600">
                Paystack Test: {PAYMENT_CONFIG.PAYSTACK.TEST_PUBLIC_KEY || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                Paystack Live: {PAYMENT_CONFIG.PAYSTACK.LIVE_PUBLIC_KEY || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                Flutterwave Test: {PAYMENT_CONFIG.FLUTTERWAVE.TEST_PUBLIC_KEY || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                Flutterwave Live: {PAYMENT_CONFIG.FLUTTERWAVE.LIVE_PUBLIC_KEY || 'NOT SET'}
              </Text>
            </VStack>
          </Box>

          {/* Raw Environment Variables */}
          <Box className="bg-background-50 p-4 rounded-lg">
            <Text size="lg" className="font-semibold text-typography-800 mb-2">
              🔍 Raw Environment Variables
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_API_URL: {process.env.EXPO_PUBLIC_API_URL || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_SUPABASE_URL: {process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_SUPABASE_ANON_KEY: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?
                  `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: {process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?
                  `${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.substring(0, 20)}...` : 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_PAYSTACK_TEST_KEY: {process.env.EXPO_PUBLIC_PAYSTACK_TEST_KEY || 'NOT SET'}
              </Text>
              <Text size="sm" className="text-typography-600">
                EXPO_PUBLIC_DEV_MODE: {process.env.EXPO_PUBLIC_DEV_MODE || 'NOT SET'}
              </Text>
            </VStack>
          </Box>

          {/* Analysis */}
          <Box className="bg-info-50 p-4 rounded-lg border border-info-200">
            <Text size="lg" className="font-semibold text-info-800 mb-2">
              📊 Analysis
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-info-700">
                • API Config matches env: {
                  API_CONFIG.BASE_URL === process.env.EXPO_PUBLIC_API_URL ? '✅ YES' :
                  API_CONFIG.BASE_URL === 'http://localhost:3000/api/v1' && !process.env.EXPO_PUBLIC_API_URL ? '⚠️ USING FALLBACK' :
                  '❌ NO'
                }
              </Text>
              <Text size="sm" className="text-info-700">
                • Supabase URL loaded: {process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ YES' : '❌ NO'}
              </Text>
              <Text size="sm" className="text-info-700">
                • Supabase Key loaded: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ YES' : '❌ NO'}
              </Text>
              <Text size="sm" className="text-info-700">
                • Google Client ID loaded: {process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? '✅ YES' : '❌ NO'}
              </Text>
            </VStack>
          </Box>

          {/* Instructions */}
          <Box className="bg-warning-50 p-4 rounded-lg border border-warning-200">
            <Text size="lg" className="font-semibold text-warning-800 mb-2">
              💡 Expected Behavior
            </Text>
            <VStack space="sm">
              <Text size="sm" className="text-warning-700">
                In React Native/Expo, all EXPO_PUBLIC_* variables should be automatically loaded from .env files.
              </Text>
              <Text size="sm" className="text-warning-700">
                If variables show "NOT SET" but exist in .env, there might be a loading issue.
              </Text>
              <Text size="sm" className="text-warning-700">
                If API_CONFIG shows fallback values, the constants are being evaluated before env loading.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
}
