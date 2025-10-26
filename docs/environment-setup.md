# Qred Environment Setup Guide

This guide walks you through setting up your development environment for **Qred: Your credit, simplified** with Supabase integration.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# ==========================================
# SUPABASE CONFIGURATION
# ==========================================
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# PAYMENT GATEWAYS
# ==========================================
# Paystack Configuration
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Flutterwave Configuration  
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxx

# ==========================================
# APP CONFIGURATION
# ==========================================
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_NAME=Qred

# ==========================================
# OPTIONAL: ANALYTICS & MONITORING
# ==========================================
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
EXPO_PUBLIC_MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# ==========================================
# OPTIONAL: GOOGLE SERVICES
# ==========================================
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxx.apps.googleusercontent.com

# ==========================================
# DEVELOPMENT SETTINGS
# ==========================================
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### 2. Supabase Project Setup

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and fill in:
   - **Project Name**: `qred-production` (or `qred-dev` for development)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)

#### Step 2: Get API Keys
1. In your Supabase dashboard, go to `Settings` → `API`
2. Copy the following values to your `.env` file:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Step 3: Configure Authentication
1. In Supabase dashboard, go to `Authentication` → `Settings`
2. **Site URL**: Set to `qred://` (for deep linking)
3. **Redirect URLs**: Add:
   - `qred://auth/callback`
   - `http://localhost:8081/auth/callback` (for development)

#### Step 4: Enable Auth Providers

**Phone Authentication:**
1. Go to `Authentication` → `Providers`
2. Enable **Phone** provider
3. Configure SMS settings (Twilio recommended)

**Google OAuth:**
1. Enable **Google** provider
2. Add your Google OAuth credentials:
   - Client ID (Web)
   - Client Secret

### 3. Database Schema Setup

#### Option 1: Using Supabase Dashboard
1. Go to `Database` → `Tables`
2. Create tables manually using the schema below

#### Option 2: Using SQL (Recommended)
1. Go to `SQL Editor` in Supabase dashboard
2. Run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "DebtStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED');

-- Users table (public profile data)
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    "phoneNumber" TEXT UNIQUE,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Debts table
CREATE TABLE "Debt" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2) DEFAULT 0,
    "calculatedInterest" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "outstandingBalance" DECIMAL(15,2) NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    status "DebtStatus" DEFAULT 'PENDING',
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "paidAt" TIMESTAMPTZ,
    "lenderId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "debtorId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "debtorPhoneNumber" TEXT NOT NULL,
    "isExternal" BOOLEAN DEFAULT FALSE,
    "externalLenderName" TEXT
);

-- Payments table
CREATE TABLE "Payment" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(15,2) NOT NULL,
    "debtId" UUID NOT NULL REFERENCES "Debt"(id) ON DELETE CASCADE,
    status "PaymentStatus" DEFAULT 'PENDING',
    reference TEXT UNIQUE NOT NULL,
    gateway TEXT NOT NULL,
    "paidAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_debt_lender ON "Debt"("lenderId");
CREATE INDEX idx_debt_debtor ON "Debt"("debtorId");
CREATE INDEX idx_payment_debt ON "Payment"("debtId");
CREATE INDEX idx_user_phone ON "User"("phoneNumber");
CREATE INDEX idx_user_email ON "User"(email);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_updated_at BEFORE UPDATE ON "Debt"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON "Payment"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Row Level Security (RLS) Setup

Run this SQL to set up security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON "User"
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON "User"
FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON "User"
FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Debt policies
CREATE POLICY "Users can view debts they're involved in" ON "Debt"
FOR SELECT USING (
    auth.uid()::text = "lenderId"::text OR 
    auth.uid()::text = "debtorId"::text
);

CREATE POLICY "Lenders can create debts" ON "Debt"
FOR INSERT WITH CHECK (auth.uid()::text = "lenderId"::text);

CREATE POLICY "Involved parties can update debts" ON "Debt"
FOR UPDATE USING (
    auth.uid()::text = "lenderId"::text OR 
    auth.uid()::text = "debtorId"::text
);

CREATE POLICY "Lenders can delete their debts" ON "Debt"
FOR DELETE USING (auth.uid()::text = "lenderId"::text);

-- Payment policies
CREATE POLICY "Users can view payments for their debts" ON "Payment"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Debt" 
        WHERE "Debt".id = "Payment"."debtId" 
        AND (auth.uid()::text = "Debt"."lenderId"::text OR auth.uid()::text = "Debt"."debtorId"::text)
    )
);

CREATE POLICY "System can manage payments" ON "Payment"
FOR ALL USING (true); -- This will be restricted by service role key usage
```

### 5. Database Functions

Create helper functions for complex operations:

```sql
-- Function to update debt balance after payment
CREATE OR REPLACE FUNCTION update_debt_balance(debt_id UUID, paid_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE "Debt" 
    SET "outstandingBalance" = "outstandingBalance" - paid_amount,
        status = CASE 
            WHEN ("outstandingBalance" - paid_amount) <= 0 THEN 'PAID'::DebtStatus
            ELSE status
        END,
        "paidAt" = CASE 
            WHEN ("outstandingBalance" - paid_amount) <= 0 THEN NOW()
            ELSE "paidAt"
        END,
        "updatedAt" = NOW()
    WHERE id = debt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user debt summary
CREATE OR REPLACE FUNCTION get_user_debt_summary(user_id UUID)
RETURNS TABLE(
    total_lending DECIMAL,
    total_owing DECIMAL,
    overdue_count BIGINT,
    pending_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM("outstandingBalance") FROM "Debt" WHERE "lenderId" = user_id AND status != 'PAID'), 0) as total_lending,
        COALESCE((SELECT SUM("outstandingBalance") FROM "Debt" WHERE "debtorId" = user_id AND status != 'PAID'), 0) as total_owing,
        (SELECT COUNT(*) FROM "Debt" WHERE ("lenderId" = user_id OR "debtorId" = user_id) AND status = 'OVERDUE') as overdue_count,
        (SELECT COUNT(*) FROM "Debt" WHERE ("lenderId" = user_id OR "debtorId" = user_id) AND status = 'PENDING') as pending_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate debt interest
CREATE OR REPLACE FUNCTION calculate_debt_interest(debt_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    debt_record RECORD;
    days_elapsed INTEGER;
    interest_amount DECIMAL;
BEGIN
    SELECT * INTO debt_record FROM "Debt" WHERE id = debt_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    days_elapsed := EXTRACT(days FROM (NOW() - debt_record."createdAt"));
    interest_amount := (debt_record."principalAmount" * debt_record."interestRate" / 100) * (days_elapsed / 365.0);
    
    RETURN ROUND(interest_amount, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 Payment Gateway Setup

### Paystack Configuration
1. Create account at [paystack.com](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy Test/Live keys to your `.env` file
4. Set webhook URL to: `https://your-project.supabase.co/functions/v1/payment-webhook`

### Flutterwave Configuration
1. Create account at [flutterwave.com](https://flutterwave.com)
2. Go to Settings → API
3. Copy Test/Live keys to your `.env` file
4. Set webhook URL to: `https://your-project.supabase.co/functions/v1/payment-webhook`

## 📱 Google OAuth Setup

### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable **Google+ API** and **Google Sign-In API**

### Step 2: OAuth Consent Screen
1. Go to **OAuth consent screen**
2. Choose **External** user type
3. Fill in application information:
   - App name: `Qred`
   - User support email: your email
   - App domain: `https://qred.app` (or your domain)

### Step 3: Create OAuth Credentials
1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Create three client IDs:

**Web Application:**
- Name: `Qred Web`
- Authorized origins: `https://your-project.supabase.co`
- Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

**Android:**
- Name: `Qred Android`
- Package name: `com.yourcompany.qred`
- SHA-1 certificate fingerprint: (get from `expo credentials:manager`)

**iOS:**
- Name: `Qred iOS`
- Bundle ID: `com.yourcompany.qred`

### Step 4: Configure Supabase
1. In Supabase, go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add Web client ID and secret

## 🚀 Development Workflow

### Initial Setup
```bash
# Clone and install
git clone <your-repo>
cd qred
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm start
```

### Environment-Specific Configuration

**Development:**
```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_DEBUG_MODE=true
```

**Staging:**
```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
EXPO_PUBLIC_DEBUG_MODE=false
```

**Production:**
```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_DEBUG_MODE=false
```

## 🔒 Security Checklist

- [ ] Supabase RLS policies enabled on all tables
- [ ] Environment variables properly set (no hardcoded secrets)
- [ ] Payment webhook endpoints secured
- [ ] Google OAuth properly configured with correct domains
- [ ] Database passwords are strong and stored securely
- [ ] API keys are using test keys for development
- [ ] Production keys are properly secured and not committed to git

## 🐛 Troubleshooting

### Common Issues

**1. Supabase Connection Failed**
- Check your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Verify project is not paused in Supabase dashboard

**2. Authentication Not Working**
- Check RLS policies are set up correctly
- Verify auth provider settings in Supabase
- Check redirect URLs match your configuration

**3. Database Queries Failing**
- Check RLS policies allow the operation
- Verify user is authenticated
- Check table and column names match exactly (case-sensitive)

**4. Payment Webhooks Not Working**
- Verify webhook URLs are correct in payment provider settings
- Check Edge Function is deployed and accessible
- Verify webhook signature validation

### Environment Validation Script

Create `scripts/validate-env.js`:

```javascript
const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run with: `node scripts/validate-env.js`

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Flutterwave API Documentation](https://developer.flutterwave.com/docs)

---

**Qred: Your credit, simplified** - Setup complete! 🎉