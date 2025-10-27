# Enhanced Debt Management Database Migration Guide

## Overview
This guide will walk you through running the enhanced debt management schema updates in your Supabase database. These updates add debtor names, payment tracking, and improved RLS policies.

## Prerequisites
- Access to your Supabase project dashboard
- Admin/Owner permissions on the project
- The test user `onboard@qred.com` should exist in your auth.users table

## Step-by-Step Migration Process

### Step 1: Access Supabase SQL Editor
1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your Qred project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query" to create a new SQL script

### Step 2: Run Schema Updates (Copy & Paste Each Section)

#### 2.1 Add New Columns
```sql
-- Add debtorName column to Debt table
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "debtorName" TEXT;

-- Add recordedBy column to Payment table
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "recordedBy" UUID REFERENCES auth.users(id);
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

#### 2.2 Add Column Documentation
```sql
-- Add documentation comments
COMMENT ON COLUMN "Debt"."debtorName" IS 'Custom name for the debtor, used for better identification when available';
COMMENT ON COLUMN "Payment"."recordedBy" IS 'User ID of who recorded this payment (lender or system)';
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

#### 2.3 Update RLS Policies for Payment Table
```sql
-- Drop existing payment policies
DROP POLICY IF EXISTS "Users can insert payments for their debts" ON "Payment";
DROP POLICY IF EXISTS "Users can view payments for their debts" ON "Payment";

-- Create new payment insert policy
CREATE POLICY "Users can insert payments for their debts" ON "Payment"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Debt"
    WHERE "Debt"."id" = "Payment"."debtId"
    AND ("Debt"."lenderId" = auth.uid() OR "Debt"."debtorId" = auth.uid())
  )
);

-- Create new payment select policy
CREATE POLICY "Users can view payments for their debts" ON "Payment"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Debt"
    WHERE "Debt"."id" = "Payment"."debtId"
    AND ("Debt"."lenderId" = auth.uid() OR "Debt"."debtorId" = auth.uid())
  )
);
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

#### 2.4 Create Performance Indexes
```sql
-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS "idx_debt_debtor_name" ON "Debt" USING gin(to_tsvector('english', "debtorName"));
CREATE INDEX IF NOT EXISTS "idx_debt_debtor_name_lower" ON "Debt" (lower("debtorName"));
CREATE INDEX IF NOT EXISTS "idx_payment_recorded_by" ON "Payment" ("recordedBy");
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

#### 2.5 Create Test Data and Verify
```sql
-- Create test data to verify new columns work
DO $$
DECLARE
    test_user_id UUID;
    test_debt_id UUID;
BEGIN
    -- Find the test user
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'onboard@qred.com'
    LIMIT 1;

    -- Only proceed if test user exists
    IF test_user_id IS NOT NULL THEN
        -- Insert a test debt with debtor name
        INSERT INTO "Debt" (
            "debtorName",
            "debtorPhoneNumber",
            "principalAmount",
            "interestRate",
            "calculatedInterest",
            "totalAmount",
            "outstandingBalance",
            "dueDate",
            "status",
            "isExternal",
            "lenderId",
            "notes"
        ) VALUES (
            'Migration Test Debtor',
            '+2348012345678',
            50000,
            10,
            5000,
            55000,
            55000,
            CURRENT_DATE + INTERVAL '30 days',
            'PENDING',
            false,
            test_user_id,
            'Test debt created by migration script'
        ) RETURNING id INTO test_debt_id;

        -- Insert a test payment with recordedBy
        INSERT INTO "Payment" (
            "debtId",
            "amount",
            "reference",
            "gateway",
            "status",
            "paidAt",
            "recordedBy"
        ) VALUES (
            test_debt_id,
            10000,
            'migration_test_' || extract(epoch from now())::text,
            'manual',
            'SUCCESSFUL',
            now(),
            test_user_id
        );

        RAISE NOTICE 'Successfully created test debt with debtorName and payment with recordedBy';
    ELSE
        RAISE NOTICE 'Test user not found - you may need to create it first';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating test data: %', SQLERRM;
END $$;
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

#### 2.6 Verify Migration Success
```sql
-- Verify the new columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Debt'
  AND column_name = 'debtorName';

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Payment'
  AND column_name = 'recordedBy';

-- Check if test data was created
SELECT
    'Test Data Status' as check_type,
    COUNT(*) as debt_count
FROM "Debt"
WHERE "debtorName" = 'Migration Test Debtor';

SELECT
    'Payment Test Data' as check_type,
    COUNT(*) as payment_count
FROM "Payment"
WHERE "recordedBy" IS NOT NULL;

-- Final success message
SELECT 'Enhanced debt management schema updates completed successfully!' as status;
```
**Action**: Copy the above SQL, paste into SQL Editor, and click "Run"

## Step 3: Test the Migration

### From Command Line
Run this command in your project directory to test the enhanced features:
```bash
npm run test:enhanced-debts
```

### Expected Results
You should see:
- ✅ All enhanced debts created successfully
- ✅ Search by debtor names working
- ✅ Payment recording with user tracking
- ✅ Payment history displaying correctly

## Step 4: Clean Up Test Data (Optional)
If you want to remove the migration test data:
```sql
-- Remove test data created by migration
DELETE FROM "Payment"
WHERE "reference" LIKE 'migration_test_%';

DELETE FROM "Debt"
WHERE "debtorName" = 'Migration Test Debtor';
```

## Troubleshooting

### If Step 2.1 Fails
- **Error**: "permission denied for table Debt"
- **Solution**: Make sure you're logged in as the project owner/admin

### If Step 2.5 Shows "Test user not found"
- **Issue**: The onboard@qred.com user doesn't exist
- **Solution**: Run this first to create the test user:
```bash
npm run test:email-auth
```

### If Payment Policies Still Don't Work
- **Check**: Go to Authentication > Policies in Supabase dashboard
- **Verify**: Payment table has the new policies listed
- **Manual Fix**: Recreate policies through the dashboard UI

## Verification Checklist

After completing all steps, verify:
- [ ] `debtorName` column exists in Debt table
- [ ] `recordedBy` column exists in Payment table
- [ ] New RLS policies are active on Payment table
- [ ] Performance indexes are created
- [ ] Test data was created successfully
- [ ] `npm run test:enhanced-debts` passes all tests

## Success Indicators

When migration is complete, you should see:
1. **In Supabase Dashboard**: New columns visible in table editor
2. **In Command Line**: Enhanced test script passes all checks
3. **In Mobile App**: Debtor names display properly, payments can be recorded

## Next Steps After Migration

1. **Test Mobile App**:
   - Sign in with `onboard@qred.com` / `password123`
   - Create debts with debtor names
   - Record payments and view history

2. **Monitor Performance**:
   - Check query performance with new indexes
   - Monitor RLS policy efficiency

3. **Deploy to Production**:
   - Run the same migration on production database
   - Test thoroughly before releasing to users

## Support

If you encounter issues:
1. Check the Supabase logs in Dashboard > Logs
2. Verify your user permissions in the project
3. Ensure all previous migrations are complete
4. Contact support with specific error messages

---

**Migration Status**: Ready to Execute
**Estimated Time**: 10-15 minutes
**Risk Level**: Low (all changes are additive and backwards compatible)
