---

# Qred: Your Credit, Simplified - Complete Documentation

## Overview

Qred is a modern debt management application that simplifies personal credit tracking and management. Built with React Native, Expo, and Supabase, it provides a seamless experience for users to track debts they owe and debts owed to them.

---

## Part 1: Backend Documentation (Supabase Backend-as-a-Service)

This documentation outlines the architecture and setup for the Qred application using Supabase as the Backend-as-a-Service platform.

### 1. Technology Stack

**Backend-as-a-Service Platform:**
*   **Supabase** - Complete backend platform with PostgreSQL database
*   **Supabase Auth** - Authentication service with multiple providers
*   **Supabase Edge Functions** - Serverless functions for secure operations
*   **Row Level Security (RLS)** - Database-level security policies

**Database & Schema Management:**
*   **PostgreSQL** - Supabase managed database
*   **Prisma** - Schema management and type generation (optional, for development)

**External Integrations:**
*   **Payment Gateways:** Paystack (primary) and Flutterwave (backup)
*   **OTP Service:** Termii (for Nigerian phone numbers)
*   **Email Service:** Supabase built-in email (development) / Custom SMTP (production)

### 2. Supabase Project Setup

#### Initial Setup
1. **Create Supabase Project:**
   - Visit [supabase.com](https://supabase.com)
   - Create new project with strong database password
   - Note down project URL and API keys

2. **Get API Credentials:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Configure Authentication Providers:**
   - **Email Authentication:** Enabled by default
   - **Phone Authentication:** Configure with Twilio or custom provider
   - **Google OAuth:** Set up Google Cloud Console integration
   - **Email Confirmation:** Configure SMTP for production

### 3. Database Schema

The database uses PostgreSQL with the following structure optimized for Supabase:

```sql
-- User profiles table (links to auth.users)
CREATE TABLE public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    "phoneNumber" TEXT UNIQUE,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Debt management table
CREATE TABLE public."Debt" (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    "principalAmount" DECIMAL NOT NULL,
    "interestRate" DECIMAL DEFAULT 0,
    "calculatedInterest" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "outstandingBalance" DECIMAL NOT NULL,
    "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED')),
    notes TEXT,
    
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "paidAt" TIMESTAMP WITH TIME ZONE,

    -- Relationships
    "lenderId" UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "debtorId" UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    "debtorPhoneNumber" TEXT NOT NULL,

    -- External debt tracking
    "isExternal" BOOLEAN DEFAULT false,
    "externalLenderName" TEXT
);

-- Payment tracking table
CREATE TABLE public."Payment" (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    amount DECIMAL NOT NULL,
    "debtId" TEXT NOT NULL REFERENCES public."Debt"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED')),
    reference TEXT UNIQUE NOT NULL,
    gateway TEXT NOT NULL,
    "paidAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_debt_lender ON public."Debt"("lenderId");
CREATE INDEX idx_debt_debtor ON public."Debt"("debtorId");
CREATE INDEX idx_debt_phone ON public."Debt"("debtorPhoneNumber");
CREATE INDEX idx_payment_debt ON public."Payment"("debtId");
```

### 4. Row Level Security (RLS) Policies

RLS policies ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Debt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Users can view own profile" ON public."User"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public."User"
    FOR UPDATE USING (auth.uid() = id);

-- Debt table policies
CREATE POLICY "Users can view debts they're involved in" ON public."Debt"
    FOR SELECT USING (
        auth.uid() = "lenderId" OR 
        auth.uid() = "debtorId"
    );

CREATE POLICY "Users can create debts as lender" ON public."Debt"
    FOR INSERT WITH CHECK (auth.uid() = "lenderId");

CREATE POLICY "Lenders can update their debts" ON public."Debt"
    FOR UPDATE USING (auth.uid() = "lenderId");

-- Payment table policies
CREATE POLICY "Users can view payments for their debts" ON public."Payment"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Debt" 
            WHERE id = "debtId" 
            AND (auth.uid() = "lenderId" OR auth.uid() = "debtorId")
        )
    );
```

### 5. Supabase Edge Functions

#### Payment Webhook Handler
```typescript
// supabase/functions/payment-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  try {
    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    // Verify signature matches Paystack secret
    // ... signature verification logic
    
    const event = JSON.parse(body);
    
    if (event.event === 'charge.success') {
      const { reference, amount } = event.data;
      const amountPaid = amount / 100; // Convert from kobo
      
      // Create admin client to bypass RLS
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      // Update payment status
      const { data: payment } = await supabase
        .from('Payment')
        .update({ status: 'SUCCESSFUL' })
        .eq('reference', reference)
        .select('debtId')
        .single();
      
      if (payment) {
        // Update debt balance using database function
        await supabase.rpc('update_debt_balance', {
          debt_id: payment.debtId,
          paid_amount: amountPaid,
        });
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})
```

#### Database Function for Debt Balance Updates
```sql
-- Function to atomically update debt balance
CREATE OR REPLACE FUNCTION update_debt_balance(debt_id TEXT, paid_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public."Debt"
  SET 
    "outstandingBalance" = "outstandingBalance" - paid_amount,
    "updatedAt" = now(),
    "paidAt" = CASE 
      WHEN ("outstandingBalance" - paid_amount) <= 0 THEN now() 
      ELSE "paidAt" 
    END,
    status = CASE 
      WHEN ("outstandingBalance" - paid_amount) <= 0 THEN 'PAID' 
      ELSE status 
    END
  WHERE id = debt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Part 2: Frontend Documentation (React Native + Expo + Supabase)

### 1. Technology Stack

**Framework & Platform:**
*   **React Native** with **Expo** (~54.0.20)
*   **TypeScript** for type safety and better development experience
*   **Expo Router** or **React Navigation** for navigation

**UI & Styling:**
*   **Gluestack UI** - Modern component library
*   **NativeWind** - Tailwind CSS for React Native
*   **Expo Vector Icons** for iconography

**State Management & Data:**
*   **Zustand** - Lightweight state management
*   **TanStack Query (React Query)** - Server state management
*   **Supabase JS Client** - Direct database access with RLS

**Authentication & Security:**
*   **Supabase Auth** - Multi-provider authentication
*   **Expo SecureStore** - Secure token storage
*   **Expo AuthSession** - OAuth flow handling

### 2. Project Structure

```
qred/
├── assets/                  # Static assets
├── components/              # All UI components
│   ├── ui/                  # Gluestack UI base components
│   ├── navigation/          # Navigation components
│   │   ├── AppNavigator.tsx # Root navigator
│   │   ├── AuthStack.tsx    # Authentication flow
│   │   └── MainStack.tsx    # Main app navigation
│   └── screens/             # Screen components
│       ├── auth/            # Authentication screens
│       │   ├── LoginScreen.tsx      # Multi-method login
│       │   ├── SignUpScreen.tsx     # Email registration
│       │   └── OTPScreen.tsx        # Phone verification
│       ├── dashboard/       # Dashboard screens
│       ├── debts/           # Debt management
│       └── profile/         # User profile & settings
├── lib/                     # Core application logic
│   ├── services/            # Supabase integration
│   │   ├── supabase.ts      # Supabase client config
│   │   ├── authService.ts   # Authentication service
│   │   └── debtService.ts   # Debt management service
│   ├── store/               # State management
│   │   ├── authStore.ts     # Authentication state
│   │   └── debtStore.ts     # Debt management state
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   └── utils/               # Helper functions
└── supabase/                # Supabase configuration
    ├── functions/           # Edge Functions
    └── migrations/          # Database migrations
```

### 3. Authentication Implementation

#### Supabase Client Setup
```typescript
// lib/services/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### Authentication Service
```typescript
// lib/services/authService.ts
import { supabase } from './supabase';

export const authService = {
  // Email authentication
  signUpWithEmail: async (email: string, password: string, metadata?: any) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
  },

  signInWithEmail: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  // Phone authentication
  sendOTP: async (phoneNumber: string) => {
    return supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });
  },

  verifyOTP: async (phoneNumber: string, token: string) => {
    return supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: 'sms',
    });
  },

  // Google OAuth
  signInWithGoogle: async (idToken: string) => {
    return supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
  },

  // Session management
  signOut: async () => {
    return supabase.auth.signOut();
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
```

### 4. Authentication Flow

#### Multi-Method Login Screen
The LoginScreen supports three authentication methods:

1. **Email/Password Authentication**
   - Toggle between phone and email login
   - Form validation and error handling
   - Direct sign-in with immediate access

2. **Phone Number + OTP**
   - Phone number validation
   - OTP generation via Termii
   - Secure verification process

3. **Google OAuth Integration**
   - One-tap Google sign-in
   - Seamless account linking
   - Profile data synchronization

#### Registration Flow
The SignUpScreen provides comprehensive registration:

```typescript
// Registration with email
const handleEmailSignUp = async (formData) => {
  const { data, error } = await authService.signUpWithEmail(
    formData.email,
    formData.password,
    {
      name: formData.name,
      phone_number: formData.phoneNumber,
    }
  );
  
  if (data.user && !error) {
    // Create user profile in public.User table
    await supabase.from('User').insert({
      id: data.user.id,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
    });
  }
};
```

### 5. Data Management with Supabase

#### Debt Service
```typescript
// lib/services/debtService.ts
import { supabase } from './supabase';

export const debtService = {
  // Fetch lending debts (RLS automatically filters)
  getLendingDebts: async () => {
    const { data, error } = await supabase
      .from('Debt')
      .select(`
        *,
        debtor:User(name, email, phoneNumber),
        payments:Payment(*)
      `)
      .eq('lenderId', (await supabase.auth.getUser()).data.user?.id);
    
    return { data, error };
  },

  // Fetch owing debts
  getOwingDebts: async () => {
    const { data, error } = await supabase
      .from('Debt')
      .select(`
        *,
        lender:User(name, email),
        payments:Payment(*)
      `)
      .eq('debtorId', (await supabase.auth.getUser()).data.user?.id);
    
    return { data, error };
  },

  // Create new debt
  createDebt: async (debtData) => {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('Debt')
      .insert({
        ...debtData,
        lenderId: user.data.user?.id,
      })
      .select()
      .single();
    
    return { data, error };
  },

  // Initialize payment
  initializePayment: async (debtId: string, amount: number) => {
    // Call Paystack API to initialize payment
    // Store payment record in database
    const { data, error } = await supabase
      .from('Payment')
      .insert({
        debtId,
        amount,
        status: 'PENDING',
        reference: generateReference(),
        gateway: 'PAYSTACK',
        paidAt: new Date().toISOString(),
      });
    
    return { data, error };
  },
};
```

### 6. State Management

#### Authentication Store
```typescript
// lib/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setSession: (session: Session) => void;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setSession: (session) => set({ 
        session, 
        isAuthenticated: !!session 
      }),

      signOut: async () => {
        await authService.signOut();
        set({ 
          user: null, 
          session: null, 
          isAuthenticated: false 
        });
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: user } = await supabase
              .from('User')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({ 
              user, 
              session, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              session: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'qred-auth-storage',
    }
  )
);
```

### 7. Profile Management

The ProfileScreen includes comprehensive profile management:

- **Profile Editing:** In-line editing with form validation
- **Profile Creation:** Automatic profile creation for new users
- **Enhanced Logout:** Improved logout with confirmation dialog
- **User Information Display:** Complete user profile view

```typescript
// Profile update functionality
const updateProfile = async (profileData) => {
  const { data, error } = await supabase
    .from('User')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();
    
  if (!error) {
    // Update local state
    useAuthStore.getState().setUser(data);
  }
  
  return { data, error };
};
```

---

## Part 3: External Integrations

### 1. Payment Processing

#### Paystack Integration (Primary)
```typescript
// Payment initialization
const initializePayment = async (debtId: string, amount: number, email: string) => {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      reference: generateUniqueReference(),
      callback_url: 'https://your-app.com/payment/callback',
      metadata: {
        debtId,
        custom_fields: [
          {
            display_name: 'Debt Payment',
            variable_name: 'debt_payment',
            value: debtId,
          },
        ],
      },
    }),
  });
  
  return response.json();
};
```

### 2. OTP Service (Termii)

```typescript
// Send OTP via Termii
const sendOTP = async (phoneNumber: string) => {
  const response = await fetch('https://api.ng.termii.com/api/sms/otp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TERMII_API_KEY,
      message_type: 'NUMERIC',
      to: phoneNumber,
      from: 'Qred',
      channel: 'dnd',
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your Qred verification code is < 1234 >. Valid for 5 minutes.',
    }),
  });
  
  return response.json();
};
```

---

## Part 4: Security & Best Practices

### 1. Security Features

- **Row Level Security (RLS):** Database-level access control
- **JWT Authentication:** Secure token-based authentication
- **Secure Storage:** Sensitive data encrypted with Expo SecureStore
- **Input Validation:** Client and server-side validation
- **Webhook Verification:** Payment webhook signature validation

### 2. Data Protection

- **Personal Data:** Minimal data collection and secure storage
- **Financial Data:** Encrypted payment references and secure processing
- **Phone Numbers:** Formatted and validated for consistency
- **Email Addresses:** Validated and optionally verified

### 3. Performance Optimizations

- **Real-time Updates:** Supabase real-time subscriptions
- **Caching:** TanStack Query for intelligent data caching
- **Offline Support:** Local state persistence with Zustand
- **Lazy Loading:** Code splitting and lazy component loading

---

## Part 5: Deployment & Configuration

### 1. Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Payment Gateways
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx (server-side only)

# OTP Service
TERMII_API_KEY=your_termii_api_key

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id

# Optional: Analytics
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Production Checklist

- [ ] Configure custom SMTP for email delivery
- [ ] Set up proper webhook endpoints for payments
- [ ] Enable email confirmation for sign-ups
- [ ] Configure rate limiting and abuse prevention
- [ ] Set up monitoring and error tracking
- [ ] Implement proper logging and analytics
- [ ] Test payment flows in sandbox environment
- [ ] Configure proper RLS policies for all tables

### 3. Mobile App Deployment

#### iOS (App Store)
```bash
# Build for App Store
expo build:ios --type archive

# Submit to App Store
expo upload:ios
```

#### Android (Play Store)
```bash
# Build AAB for Play Store
expo build:android --type app-bundle

# Submit to Play Store
expo upload:android
```

---

## Part 6: Testing & Quality Assurance

### 1. Testing Strategy

- **Unit Tests:** Jest for utility functions and services
- **Integration Tests:** Testing API interactions with Supabase
- **E2E Tests:** Detox for complete user flow testing
- **Manual Testing:** Comprehensive test scenarios

### 2. Test Scenarios

#### Authentication Flow
- Email sign-up and verification
- Phone OTP verification
- Google OAuth integration
- Session persistence and refresh
- Multi-device login handling

#### Debt Management
- Creating debts with validation
- Updating debt status
- Payment processing
- Real-time updates
- Offline data synchronization

#### Security Testing
- RLS policy enforcement
- Input validation and sanitization
- Authentication token security
- Payment webhook verification

---

## Conclusion

Qred represents a modern approach to debt management, leveraging Supabase's powerful Backend-as-a-Service platform to provide a secure, scalable, and user-friendly application. The combination of React Native, Expo, and Supabase creates a robust foundation for personal financial management while maintaining simplicity and ease of use.

The multi-method authentication system (email, phone, and Google OAuth) ensures accessibility for all users, while the comprehensive debt management features provide the tools needed for effective credit tracking and payment processing.

With proper deployment and configuration, Qred is ready for production use and can scale to support thousands of users while maintaining security and performance standards.