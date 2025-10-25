That is an **excellent decision** and a very modern approach to building applications.

Using Supabase is a fantastic idea for this project. It directly addresses your goal of maintaining a minimal repository and simplifying hosting. You are essentially replacing the entire self-hosted Node.js/TypeScript backend with a powerful, managed service.

Let's break down what this change means and then generate the updated documentation.

### What This Change Means: Supabase vs. Self-Hosted Backend

*   **No Separate Backend Repo:** You will not need to create and maintain a separate Express.js server. Your "backend" logic will now live inside Supabase's ecosystem.
*   **All-in-One Platform:** Supabase provides the PostgreSQL database, authentication, auto-generated APIs, real-time subscriptions, and serverless functions (Edge Functions) out of the box.
*   **Direct Database Access:** Your Expo app will communicate *directly* and securely with the Supabase API using the official client library. You don't write the API endpoints; Supabase creates them for you based on your database schema.
*   **Security is Handled by RLS:** Instead of writing logic in API endpoints to check if a user is allowed to see a debt (e.g., `if (req.user.id !== debt.lenderId) { return res.status(403).send(...) }`), you will use PostgreSQL's **Row Level Security (RLS)**. This is a set of rules in the database itself that ensures users can only access data they own.

This is a powerful, efficient, and scalable way to build. Now, let's update the documentation.

---

## Part 1: Backend Documentation (Supabase & Prisma)

This documentation outlines the architecture and setup for your Supabase project. While you can create your schema directly in the Supabase UI, using Prisma allows you to version control your schema, which is excellent practice.

### 1. Technology Stack

*   **Backend-as-a-Service (BaaS):** Supabase
*   **Database:** Supabase PostgreSQL
*   **Schema Management:** Prisma
*   **Authentication:** Supabase Auth (handles Google Sign-In, Phone OTP, JWTs)
*   **Server-side Logic:** Supabase Edge Functions (for tasks that need a secure server environment, like payment webhooks)

### 2. Supabase Project Setup

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com), create an account, and start a new project. Choose a strong database password and save it securely.
2.  **Get API Keys:** In your project's dashboard, go to `Project Settings` > `API`. You will find your **Project URL** and `anon` **public key**. These will be used in your Expo app.
3.  **Link Prisma to Supabase:**
    *   In your local development environment (it can be a separate directory or within your Expo project), set up Prisma.
    *   Get your database connection string from Supabase: `Project Settings` > `Database` > `Connection string`.
    *   Set this connection string in your `.env` file for the `DATABASE_URL` variable.
    *   Run `npx prisma db pull` to sync your Prisma schema with the initial Supabase database state.
    *   From now on, you will edit your `schema.prisma` file and use `npx prisma db push` to push changes to your Supabase database.

### 3. The `schema.prisma` file (Optimized for Supabase)

This schema is nearly identical to the previous one, but it's important to remember that policies (RLS) will be built on top of these tables within Supabase.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Use `directUrl` for migrations with tools like Prisma Migrate
  directUrl = env("DIRECT_URL")
}

// ======================================
//          USER & AUTH MODELS
// ======================================
// Supabase Auth manages its own `auth.users` table.
// This `User` table is for public profile data that you want to link to.
// The `id` will be a foreign key referencing `auth.users.id`.

model User {
  id          String   @id @default(uuid()) // This MUST match the UUID from auth.users
  email       String?  @unique
  name        String
  phoneNumber String?  @unique
  avatarUrl   String?

  // Relationships
  debtsAsLender Debt[]   @relation("LenderDebts")
  debtsAsDebtor Debt[]   @relation("DebtorDebts")
}

// ======================================
//          CORE DEBT MODELS
// ======================================

model Debt {
  id                 String      @id @default(cuid())
  principalAmount    Float
  interestRate       Float       @default(0)
  calculatedInterest Float
  totalAmount        Float
  outstandingBalance Float
  dueDate            DateTime
  status             DebtStatus  @default(PENDING)
  notes              String?
  
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  paidAt             DateTime?

  // Relationships
  lenderId           String      // This will be a UUID referencing User.id
  lender             User        @relation("LenderDebts", fields: [lenderId], references: [id], onDelete: Cascade)

  debtorId           String?     // UUID referencing User.id if they are on the platform
  debtor             User?       @relation("DebtorDebts", fields: [debtorId], references: [id], onDelete: SetNull)
  debtorPhoneNumber  String      // Used for linking/inviting

  // For personal, off-platform tracking
  isExternal         Boolean     @default(false)
  externalLenderName String?

  payments           Payment[]

  @@index([lenderId])
  @@index([debtorId])
}

model Payment {
  id        String        @id @default(cuid())
  amount    Float
  debtId    String
  debt      Debt          @relation(fields: [debtId], references: [id], onDelete: Cascade)
  status    PaymentStatus @default(PENDING)
  reference String        @unique
  gateway   String
  paidAt    DateTime

  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([debtId])
}

// ======================================
//               ENUMS
// ======================================

enum DebtStatus {
  PENDING
  PAID
  OVERDUE
  DEFAULTED
}

enum PaymentStatus {
  PENDING
  SUCCESSFUL
  FAILED
}

```

### 4. Row Level Security (RLS) - The Core of Your Logic

This is the most critical part. In the Supabase dashboard, under `Authentication` > `Policies`, you will enable RLS for each table and define the rules.

**Example RLS Policy for the `Debt` table:**

1.  **Users can see debts where they are the lender OR the debtor:**
    *   **Policy Name:** `Allow read access to involved parties`
    *   **Target Roles:** `authenticated`
    *   **Command:** `SELECT`
    *   **USING expression:** `(auth.uid() = "lenderId") OR (auth.uid() = "debtorId")`

2.  **Lenders can create new debts:**
    *   **Policy Name:** `Allow lenders to create debts`
    *   **Target Roles:** `authenticated`
    *   **Command:** `INSERT`
    *   **WITH CHECK expression:** `auth.uid() = "lenderId"` (Ensures a user can only create a debt where they are the lender).

3.  **Users can only update debts under specific conditions (e.g., a debtor can't change the amount):**
    *   This would require more complex policies or, even better, a `rpc` function (a custom database function) to handle updates securely.

### 5. Server-side Logic: Supabase Edge Functions

For things that cannot be done in the browser (like handling payment webhooks), you'll use Edge Functions.

**Example: Payment Webhook Edge Function** (`supabase/functions/payment-webhook/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  // 1. Verify the webhook signature to ensure it's from Paystack/Flutterwave
  // ... (verification logic here)

  const event = await req.json();

  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const amountPaid = event.data.amount / 100; // Convert from kobo/cents

    // 2. Create an admin Supabase client to bypass RLS for this trusted server-side operation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Find the payment and update its status
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Payment')
      .update({ status: 'SUCCESSFUL' })
      .eq('reference', reference)
      .select('debtId')
      .single();

    if (payment) {
      // 4. Update the outstanding balance on the debt
      // This should be done in a database function (rpc) for atomicity
      await supabaseAdmin.rpc('update_debt_balance', {
        debt_id: payment.debtId,
        paid_amount: amountPaid,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
})
```

---

## Part 2: Frontend Documentation (Expo with Supabase)

Your project structure remains excellent. The main change is how you fetch data.

### 1. New Libraries to Install

```bash
npm install @supabase/supabase-js
# For secure storage of the session
npm install expo-secure-store
```

### 2. Initializing Supabase

Create a file `services/supabase.ts` to initialize the client.

**`services/supabase.ts`**
```typescript
import 'react-native-url-polyfill/auto'; // Required for Supabase to work
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Adapter for SecureStore to work like localStorage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = 'YOUR_SUPABASE_URL'; // From your project settings
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // From your project settings

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 3. Updated Logic & Flow

#### Step 1: Authentication

Your `authService.ts` will now be much simpler.

**`services/authService.ts`**
```typescript
import { supabase } from './supabase';

export const authService = {
  signInWithGoogle: async () => {
    // Logic for this depends on the Expo auth library you use
    // The goal is to get an id_token from Google and pass it to Supabase
    // e.g., using `expo-auth-session`
    // return supabase.auth.signInWithIdToken({ provider: 'google', token: id_token });
  },

  sendOtp: async (phoneNumber: string) => {
    return supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });
  },

  verifyOtp: async (phoneNumber: string, token: string) => {
    return supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: 'sms',
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },
};
```

#### Step 2: Data Fetching with RLS

Your `debtService` no longer calls an API you built. It calls the Supabase client directly. RLS handles the security automatically.

**`services/debtService.ts`**
```typescript
import { supabase } from './supabase';

export const debtService = {
  // RLS ensures this only returns debts where the logged-in user is the lender
  getLendingDebts: async () => {
    const { data, error } = await supabase
      .from('Debt')
      .select('*, debtor:User(*)') // You can even fetch related data
      .eq('lenderId', (await supabase.auth.getSession()).data.session?.user.id);
    
    if (error) throw error;
    return data;
  },

  // RLS ensures this only returns debts where the logged-in user is the debtor
  getOwingDebts: async () => {
     const { data, error } = await supabase
      .from('Debt')
      .select('*, lender:User(*)')
      .eq('debtorId', (await supabase.auth.getSession()).data.session?.user.id);

    if (error) throw error;
    return data;
  },
  
  createDebt: async (payload: any) => { // Define a proper type for payload
     const { data, error } = await supabase.from('Debt').insert([payload]).select();
     if (error) throw error;
     return data;
  }
};
```

Your `useDebts.ts` hook will work exactly as before, but it will be calling these new service functions. The beauty is that the UI layer doesn't need to change much, but the underlying data layer is now simpler and more powerful.
