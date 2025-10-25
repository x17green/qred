
---

## Part 1: Backend Documentation (TypeScript, Node.js, Prisma)

This documentation outlines the architecture, API endpoints, and database structure for the Debt Collector application's backend.

### 1. Technology Stack

*   **Language:** TypeScript
*   **Framework:** Express.js (recommended) or NestJS for a more structured approach.
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **Authentication:** JWT (JSON Web Tokens) for session management.
*   **Payment Gateway:** Paystack or Flutterwave (via API integration).
*   **OTP Service:** Termii (for Nigerian phone numbers) or Twilio.

### 2. Project Setup (Recommended)

```bash
# 1. Initialize a new Node.js project
npm init -y
npm install typescript ts-node @types/node --save-dev

# 2. Install dependencies
npm install express cors dotenv jsonwebtoken bcryptjs
npm install @prisma/client
npm install @types/express @types/cors @types/bcryptjs --save-dev

# 3. Initialize TypeScript
npx tsc --init

# 4. Initialize Prisma
npx prisma init --datasource-provider postgresql
```

### 3. API Endpoints

The API should be versioned (e.g., `/api/v1/...`) to ensure future compatibility.

#### `/auth` - Authentication Routes

*   **`POST /api/v1/auth/google-signin`**
    *   **Description:** Authenticates a user via their Google account.
    *   **Body:** `{ "googleToken": "..." }`
    *   **Logic:**
        1.  Receives the Google Auth Token from the frontend.
        2.  Verifies the token with Google's API.
        3.  Checks if a user with the resulting email exists.
        4.  If user exists, returns a flag indicating phone verification is needed.
        5.  If not, creates a temporary user record or prompts for phone number association.
    *   **Response:** `{ "message": "Proceed to phone verification", "email": "user@google.com", "name": "User Name" }`

*   **`POST /api/v1/auth/send-otp`**
    *   **Description:** Sends an OTP to the user's phone number.
    *   **Body:** `{ "phoneNumber": "+234..." }`
    *   **Logic:**
        1.  Generates a 6-digit OTP.
        2.  Stores a hash of the OTP with the phone number and an expiry time (e.g., 10 minutes) in the database or cache.
        3.  Uses an OTP provider (Termii/Twilio) to send the SMS.
    *   **Response:** `{ "message": "OTP sent successfully" }`

*   **`POST /api/v1/auth/verify-otp`**
    *   **Description:** Verifies the OTP and logs the user in or creates their account.
    *   **Body:** `{ "phoneNumber": "+234...", "otp": "123456", "googleProfile": { "email": "...", "name": "..." } }` (googleProfile is optional, used for first-time sign-up).
    *   **Logic:**
        1.  Finds the stored OTP for the phone number and checks if it's valid and not expired.
        2.  If valid, finds a user with that phone number.
        3.  **Existing User:** Logs them in. Generates a JWT.
        4.  **New User:** Creates a new `User` record using the phone number and associated Google profile data. Generates a JWT.
        5.  Checks for and links any unclaimed debts matching this phone number.
    *   **Response:** `{ "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`

#### `/users` - User Management Routes (Authenticated)

*   **`GET /api/v1/users/me`**
    *   **Description:** Fetches the profile of the currently logged-in user.
    *   **Auth:** Requires JWT.
    *   **Response:** Returns the user's data (name, email, phone number, etc.).

#### `/debts` - Debt Management Routes (Authenticated)

*   **`POST /api/v1/debts`**
    *   **Description:** Creates a new debt record (as a lender) or a personal debt record.
    *   **Auth:** Requires JWT.
    *   **Body:** `{ "debtorPhoneNumber": "+234...", "principal": 10000, "interestRate": 10, "dueDate": "2025-12-31T23:59:59.000Z", "notes": "...", "isExternal": false, "externalLenderName": null }`
    *   **Logic:**
        1.  Validates the input.
        2.  If `isExternal` is true, it creates a personal debt linked only to the lender.
        3.  If `isExternal` is false, it looks for a user with `debtorPhoneNumber`.
        4.  Creates the `Debt` record, linking `lenderId` to the current user and `debtorId` if the debtor user exists.
    *   **Response:** The newly created debt object.

*   **`GET /api/v1/debts/lending`**
    *   **Description:** Fetches all debts where the current user is the lender.
    *   **Auth:** Requires JWT.
    *   **Response:** An array of debt objects.

*   **`GET /api/v1/debts/owing`**
    *   **Description:** Fetches all debts where the current user is the debtor (both on-platform and external).
    *   **Auth:** Requires JWT.
    *   **Response:** An array of debt objects.

*   **`PATCH /api/v1/debts/:id/status`**
    *   **Description:** Manually updates the status of a debt (e.g., marking an external debt as paid).
    *   **Auth:** Requires JWT.
    *   **Body:** `{ "status": "PAID" }`
    *   **Response:** The updated debt object.

#### `/payments` - Payment Routes (Authenticated)

*   **`POST /api/v1/payments/initialize`**
    *   **Description:** Initializes a payment transaction with the payment gateway.
    *   **Auth:** Requires JWT.
    *   **Body:** `{ "debtId": "...", "amount": 5000, "email": "debtor@email.com" }`
    *   **Logic:**
        1.  Communicates with Paystack/Flutterwave API to create a transaction.
        2.  Stores the transaction reference in the `Payment` table with a `PENDING` status.
    *   **Response:** `{ "authorization_url": "...", "access_code": "...", "reference": "..." }` (from the payment gateway).

*   **`POST /api/v1/payments/webhook`**
    *   **Description:** A webhook endpoint for the payment gateway to send transaction status updates. **This should not be a protected route.**
    *   **Body:** Varies by provider (e.g., Paystack's event payload).
    *   **Logic:**
        1.  **Crucial:** Verify the webhook signature to ensure the request is from the actual payment gateway.
        2.  If payment is successful (`charge.success` or similar):
            *   Find the `Payment` record using the transaction reference.
            *   Update its status to `SUCCESSFUL`.
            *   Update the corresponding `Debt` record by decreasing the `outstandingBalance`.
            *   If the balance is zero, update the debt `status` to `PAID`.
            *   Send a notification (push/email) to both lender and debtor.

### 4. `schema.prisma` file

This schema is designed to be comprehensive, scalable, and handle all the features discussed.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ======================================
//          USER & AUTH MODELS
// ======================================

model User {
  id            String    @id @default(cuid())
  email         String?   @unique // Optional until linked with Google
  name          String
  phoneNumber   String    @unique
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // A user can be a lender in many debts
  debtsAsLender Debt[]    @relation("LenderDebts")

  // A user can be a debtor in many debts
  debtsAsDebtor Debt[]    @relation("DebtorDebts")

  // OTP storage for verification
  otp           OTP?
}

model OTP {
  id        String   @id @default(cuid())
  otpHash   String
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  expiresAt DateTime
}

// ======================================
//          CORE DEBT MODELS
// ======================================

model Debt {
  id                   String        @id @default(cuid())
  principalAmount      Float
  interestRate         Float         @default(0) // Percentage, e.g., 10 for 10%
  calculatedInterest   Float
  totalAmount          Float         // principal + interest
  outstandingBalance   Float
  dueDate              DateTime
  status               DebtStatus    @default(PENDING)
  notes                String?
  
  // Timestamps
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  paidAt               DateTime?

  // Relationships
  lenderId             String
  lender               User          @relation("LenderDebts", fields: [lenderId], references: [id], onDelete: Cascade)

  // Debtor can be on or off platform
  debtorId             String?
  debtor               User?         @relation("DebtorDebts", fields: [debtorId], references: [id], onDelete: SetNull)
  debtorPhoneNumber    String        // Used to link debt to a user when they sign up

  // Handling external debts (personal tracking)
  isExternal           Boolean       @default(false)
  externalLenderName   String?       // e.g., "John Doe (Cash)"

  // A debt can have multiple payment attempts
  payments             Payment[]
  
  // A debt can have reminders/notifications
  notifications        Notification[]

  @@index([lenderId])
  @@index([debtorId])
  @@index([debtorPhoneNumber])
}

model Payment {
  id            String         @id @default(cuid())
  amount        Float
  debtId        String
  debt          Debt           @relation(fields: [debtId], references: [id], onDelete: Cascade)
  status        PaymentStatus  @default(PENDING)
  reference     String         @unique // From payment gateway
  gateway       String         // e.g., "PAYSTACK", "FLUTTERWAVE"
  paidAt        DateTime
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([debtId])
}

// ======================================
//      NOTIFICATIONS & REMINDERS
// ======================================

model Notification {
  id        String           @id @default(cuid())
  userId    String           // The user who receives the notification
  debtId    String?          // Optional: link to a specific debt
  debt      Debt?            @relation(fields: [debtId], references: [id], onDelete: SetNull)
  type      NotificationType
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId])
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

enum NotificationType {
  DEBT_CREATED
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  DUE_DATE_REMINDER
  DEBT_OVERDUE
  DEBT_PAID_OFF
}
```

---

## Part 2: Frontend Documentation (Expo, gluestack-ui, TypeScript)

This documentation aligns with your provided file structure and `package.json`, focusing on building a scalable and maintainable frontend.

### 1. Project Structure (Enhanced for Scalability)

Based on the current scalable structure, here is the organized layout:

```
debt-collector/
├── assets/                  # Static assets (fonts, images, icons)
├── components/              # All UI and screen components
│   ├── ui/                  # Gluestack UI base components
│   ├── core/                # App-specific component wrappers
│   ├── domain/              # Business logic components (DebtCard, ProfileHeader)
│   ├── layout/              # Layout and structure components
│   ├── navigation/          # All React Navigation setup
│   │   ├── AppNavigator.tsx # Main navigator (switches between Auth and Main stacks)
│   │   ├── AuthStack.tsx    # Screens for login, signup, OTP
│   │   └── MainTabNavigator.tsx # Bottom tab navigator for the main app
│   └── screens/             # Top-level screen components
│       ├── auth/            # Authentication screens
│       │   ├── LoginScreen.tsx
│       │   └── OTPScreen.tsx
│       ├── dashboard/       # Main dashboard/home screen
│       │   └── DashboardScreen.tsx
│       ├── debts/           # Screens related to debt management
│       │   ├── MyDebtsScreen.tsx
│       │   ├── DebtDetailScreen.tsx
│       │   └── AddDebtScreen.tsx
│       └── profile/         # User profile and settings
│           └── ProfileScreen.tsx
├── lib/                     # Core application logic
│   ├── constants/           # App-wide constants (colors, API URLs)
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Hook to access auth state and actions
│   │   └── useDebts.ts      # Hook to fetch and manage debt data
│   ├── services/            # API communication layer
│   │   ├── api.ts           # Axios or fetch instance setup (base URL, headers)
│   │   ├── authService.ts   # Auth-related API calls
│   │   └── debtService.ts   # Debt-related API calls
│   ├── store/               # State management (Zustand)
│   │   ├── authStore.ts     # Handles user session, token
│   │   └── debtStore.ts     # Caches debts, manages loading states
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions (date formatting, validation)
└── App.tsx                  # Root component, entry point
```

### 2. Core Libraries & Their Roles

*   **React Navigation:** Used for navigation between screens with stack and tab navigators located in `components/navigation/`.
*   **gluestack-ui:** Primary component library with base components in `components/ui/` and custom wrappers in `components/core/` (e.g., `<PrimaryButton>`, `<FormInput>`). This makes future design system changes easy.
*   **NativeWind / Tailwind:** Used for styling custom components and making fine-grained adjustments to gluestack-ui components where needed.
*   **Zustand:** Lightweight state management library in `lib/store/` for managing global state like user authentication and debt data without Redux boilerplate.
*   **TanStack Query (React Query):** Manages server state with caching, background refetching, and loading/error states. Hooks are located in `lib/hooks/` and services in `lib/services/`.

### 3. Frontend Logic & Flow

#### Step 1: Authentication Flow

1.  **App Entry (`App.tsx`):** The app starts and checks for a stored JWT (using a `useAuth` hook from `lib/store/authStore`).
2.  **Navigator (`components/navigation/AppNavigator.tsx`):**
    *   If a token exists and is valid, it renders the `MainTabNavigator`.
    *   If no token exists, it renders the `AuthStack`.
3.  **Login Screen (`components/screens/auth/LoginScreen.tsx`):**
    *   UI: Provides "Sign in with Google" button.
    *   Logic: Uses `expo-auth-session` to initiate Google login. On success, calls `lib/services/authService.googleSignin()`.
    *   On a successful response from the backend, it navigates to the `OTPScreen`, passing the user's phone number.
4.  **OTP Screen (`components/screens/auth/OTPScreen.tsx`):**
    *   UI: An input field for the OTP.
    *   Logic: On submit, calls `lib/services/authService.verifyOtp()`. On success, the `lib/store/authStore` saves the JWT, and the `AppNavigator` will automatically switch to the `MainTabNavigator`.

#### Step 2: Displaying Debts

1.  **Dashboard Screen (`components/screens/dashboard/DashboardScreen.tsx`):**
    *   UI: A summary view showing "Total I'm Owed" and "Total I Owe". A list of active debts.
    *   Logic: Uses a `useDebts` hook from `lib/hooks/` (which internally uses TanStack Query and `lib/services/debtService`) to fetch data from both `/debts/lending` and `/debts/owing` endpoints.
    *   It renders `DebtCard` components for each item.
2.  **DebtCard Component (`components/domain/DebtCard.tsx`):**
    *   A reusable component that takes a `debt` object as a prop.
    *   Displays key information: debtor/lender name, outstanding amount, and due date.
    *   The card is pressable and navigates to the `DebtDetailScreen`.

#### Step 3: Creating a Debt

1.  **Add Debt Screen (`components/screens/debts/AddDebtScreen.tsx`):**
    *   UI: A form built with custom `FormInput` components from `components/core/`. Fields for debtor's phone, amount, interest, due date, etc. A switch to toggle `isExternal`.
    *   State Management: Uses `useState` or a form library like `react-hook-form` to manage form state.
    *   Logic: On submit, it calls `lib/services/debtService.createDebt()`. It leverages TanStack Query's mutation capabilities to automatically refetch the debt list on success, updating the UI seamlessly.

### 4. Code Example: A Service and a Hook

**`lib/services/debtService.ts`**

```typescript
import { api } from './api'; // Your configured Axios instance

export interface CreateDebtPayload {
  debtorPhoneNumber: string;
  principal: number;
  interestRate: number;
  dueDate: string;
  isExternal?: boolean;
  externalLenderName?: string;
}

export const debtService = {
  getLendingDebts: async () => {
    const response = await api.get('/debts/lending');
    return response.data;
  },
  
  getOwingDebts: async () => {
    const response = await api.get('/debts/owing');
    return response.data;
  },

  createDebt: async (payload: CreateDebtPayload) => {
    const response = await api.post('/debts', payload);
    return response.data;
  },
};
```

**`lib/hooks/useDebts.ts` (with TanStack Query)**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtService } from '../services/debtService';

export const useDebts = () => {
  const queryClient = useQueryClient();

  const { data: lendingDebts, isLoading: isLoadingLending } = useQuery({
    queryKey: ['debts', 'lending'],
    queryFn: debtService.getLendingDebts,
  });

  const { data: owingDebts, isLoading: isLoadingOwing } = useQuery({
    queryKey: ['debts', 'owing'],
    queryFn: debtService.getOwingDebts,
  });

  const createDebtMutation = useMutation({
    mutationFn: debtService.createDebt,
    onSuccess: () => {
      // When a new debt is created, invalidate and refetch existing queries
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  return {
    lendingDebts,
    isLoadingLending,
    owingDebts,
    isLoadingOwing,
    createDebt: createDebtMutation.mutate,
  };
};
```
