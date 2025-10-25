// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@debt_collector:auth_token',
  USER_DATA: '@debt_collector:user_data',
  ONBOARDING_COMPLETED: '@debt_collector:onboarding_completed',
  BIOMETRIC_ENABLED: '@debt_collector:biometric_enabled',
  THEME_PREFERENCE: '@debt_collector:theme_preference',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Debt Collector',
  VERSION: '1.0.0',
  CURRENCY: '₦', // Nigerian Naira
  CURRENCY_CODE: 'NGN',
  DEFAULT_INTEREST_RATE: 10,
  MAX_DEBT_AMOUNT: 10000000, // 10 million
  MIN_DEBT_AMOUNT: 100,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
};

// Phone Number Configuration
export const PHONE_CONFIG = {
  COUNTRY_CODE: '+234',
  MIN_LENGTH: 10,
  MAX_LENGTH: 11,
  FORMATS: [
    /^0[7-9][0-1]\d{8}$/, // MTN, Airtel, 9mobile formats
    /^0[7-9][0-1]\d{8}$/,
  ],
};

// Date & Time Configuration
export const DATE_CONFIG = {
  DEFAULT_FORMAT: 'DD/MM/YYYY',
  API_FORMAT: 'YYYY-MM-DD',
  DISPLAY_FORMAT: 'MMM DD, YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'MMM DD, YYYY HH:mm',
  TIMEZONE: 'Africa/Lagos',
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 11,
    REQUIRED_PREFIX: ['070', '080', '081', '090', '091'],
  },
  OTP: {
    LENGTH: 6,
    NUMERIC_ONLY: true,
  },
  DEBT: {
    MIN_AMOUNT: 100,
    MAX_AMOUNT: 10000000,
    MIN_INTEREST_RATE: 0,
    MAX_INTEREST_RATE: 100,
    MAX_NOTES_LENGTH: 500,
  },
};

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  PAGINATION_SIZE: 20,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Colors (Tailwind-compatible)
export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Status Messages
export const MESSAGES = {
  SUCCESS: {
    DEBT_CREATED: 'Debt record created successfully',
    DEBT_UPDATED: 'Debt record updated successfully',
    DEBT_DELETED: 'Debt record deleted successfully',
    PAYMENT_SUCCESSFUL: 'Payment completed successfully',
    OTP_SENT: 'OTP sent successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
  },
  ERROR: {
    NETWORK_ERROR: 'Network error. Please check your connection',
    INVALID_CREDENTIALS: 'Invalid credentials',
    INVALID_OTP: 'Invalid OTP code',
    OTP_EXPIRED: 'OTP has expired',
    PHONE_REQUIRED: 'Phone number is required',
    INVALID_PHONE: 'Please enter a valid phone number',
    DEBT_NOT_FOUND: 'Debt record not found',
    PAYMENT_FAILED: 'Payment failed. Please try again',
    UNAUTHORIZED: 'Unauthorized access',
    SERVER_ERROR: 'Server error. Please try again later',
    VALIDATION_ERROR: 'Please check your input',
    CAMERA_PERMISSION: 'Camera permission is required',
    GALLERY_PERMISSION: 'Gallery permission is required',
  },
  INFO: {
    LOADING: 'Loading...',
    PROCESSING: 'Processing...',
    REFRESHING: 'Refreshing...',
    NO_DATA: 'No data available',
    NO_DEBTS: 'No debts found',
    NO_PAYMENTS: 'No payments found',
    PULL_TO_REFRESH: 'Pull to refresh',
  },
};

// Payment Gateway Configuration
export const PAYMENT_CONFIG = {
  PAYSTACK: {
    TEST_PUBLIC_KEY: process.env.EXPO_PUBLIC_PAYSTACK_TEST_KEY || '',
    LIVE_PUBLIC_KEY: process.env.EXPO_PUBLIC_PAYSTACK_LIVE_KEY || '',
  },
  FLUTTERWAVE: {
    TEST_PUBLIC_KEY: process.env.EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY || '',
    LIVE_PUBLIC_KEY: process.env.EXPO_PUBLIC_FLUTTERWAVE_LIVE_KEY || '',
  },
  SUPPORTED_GATEWAYS: ['PAYSTACK', 'FLUTTERWAVE'],
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    DEBT_REMINDERS: 'debt_reminders',
    PAYMENT_UPDATES: 'payment_updates',
    GENERAL: 'general',
  },
  TYPES: {
    DEBT_DUE: 'debt_due',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    DEBT_OVERDUE: 'debt_overdue',
    NEW_DEBT: 'new_debt',
  },
};

// Deep Link Configuration
export const DEEP_LINK_CONFIG = {
  SCHEME: 'debtcollector',
  DOMAIN: 'debtcollector.app',
  PATHS: {
    DEBT_DETAIL: '/debt/:id',
    PAYMENT: '/payment/:reference',
    PROFILE: '/profile',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: true,
  DARK_MODE: true,
  OFFLINE_MODE: false,
  ANALYTICS: true,
  CRASH_REPORTING: true,
  PAYMENT_GATEWAY: true,
  EXTERNAL_DEBTS: true,
};

// Regex Patterns
export const REGEX_PATTERNS = {
  PHONE: /^(\+234|0)[7-9][0-1]\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OTP: /^\d{6}$/,
  AMOUNT: /^\d+(\.\d{1,2})?$/,
  INTEREST_RATE: /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/,
  NIGERIAN_PHONE: /^((\+234)|0)[7-9][0-1]\d{8}$/,
  INTERNATIONAL_PHONE: /^\+[1-9]\d{1,14}$/,
};

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_FLIPPER: __DEV__,
  ENABLE_REACTOTRON: __DEV__,
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  API_LOGGING: __DEV__,
  REDUX_LOGGING: __DEV__,
};

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  OTP_ERROR: 'OTP_ERROR',
  PHONE_ERROR: 'PHONE_ERROR',
};

// App States
export const APP_STATES = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
  REFRESHING: 'refreshing',
};

// Bottom Tab Icons
export const TAB_ICONS = {
  DASHBOARD: 'home',
  DEBTS: 'credit-card',
  PROFILE: 'user',
  NOTIFICATIONS: 'bell',
  SETTINGS: 'settings',
};

// Screen Names
export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  OTP: 'OTP',

  // Main Tab
  DASHBOARD: 'Dashboard',
  DEBTS: 'Debts',
  PROFILE: 'Profile',

  // Debt Stack
  DEBT_LIST: 'DebtList',
  DEBT_DETAIL: 'DebtDetail',
  ADD_DEBT: 'AddDebt',
  EDIT_DEBT: 'EditDebt',

  // Profile Stack
  PROFILE_SETTINGS: 'ProfileSettings',
  NOTIFICATIONS_SETTINGS: 'NotificationsSettings',
  SECURITY_SETTINGS: 'SecuritySettings',
  ABOUT: 'About',
};
