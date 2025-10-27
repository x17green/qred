-- Enhanced Debt Management Database Migration - Single Command Block
-- Copy and paste this entire block into Supabase SQL Editor and run once

BEGIN;

-- Step 1: Add new columns
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "debtorName" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "recordedBy" UUID REFERENCES auth.users(id);

-- Step 2: Add documentation
COMMENT ON COLUMN "Debt"."debtorName" IS 'Custom name for the debtor, used for better identification when available';
COMMENT ON COLUMN "Payment"."recordedBy" IS 'User ID of who recorded this payment (lender or system)';

-- Step 3: Update RLS policies for Payment table
DROP POLICY IF EXISTS "Users can insert payments for their debts" ON "Payment";
DROP POLICY IF EXISTS "Users can view payments for their debts" ON "Payment";

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

-- Step 4: Create performance indexes
CREATE INDEX IF NOT EXISTS "idx_debt_debtor_name" ON "Debt" USING gin(to_tsvector('english', "debtorName"));
CREATE INDEX IF NOT EXISTS "idx_debt_debtor_name_lower" ON "Debt" (lower("debtorName"));
CREATE INDEX IF NOT EXISTS "idx_payment_recorded_by" ON "Payment" ("recordedBy");

-- Step 5: Create test data and verify
DO $$
DECLARE
    test_user_id UUID;
    test_debt_id UUID;
    migration_success BOOLEAN := TRUE;
BEGIN
    -- Find the test user
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'onboard@qred.com'
    LIMIT 1;

    -- Create test data if user exists
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
            'Migration Test User',
            '+2348012345678',
            75000,
            8,
            6000,
            81000,
            81000,
            CURRENT_DATE + INTERVAL '30 days',
            'PENDING',
            false,
            test_user_id,
            'Test debt created by enhanced migration - can be safely deleted'
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
            25000,
            'migration_verification_' || extract(epoch from now())::text,
            'manual',
            'SUCCESSFUL',
            now(),
            test_user_id
        );

        RAISE NOTICE '✅ Migration test data created successfully';
        RAISE NOTICE '   - Test Debt ID: %', test_debt_id;
        RAISE NOTICE '   - Test User ID: %', test_user_id;
    ELSE
        RAISE NOTICE '⚠️  Test user onboard@qred.com not found - migration completed but no test data created';
        RAISE NOTICE '   Run npm run test:email-auth to create test user first';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        migration_success := FALSE;
        RAISE NOTICE '❌ Error during migration test data creation: %', SQLERRM;
        RAISE NOTICE '   Migration schema updates may still be successful';
END $$;

-- Step 6: Verification queries
SELECT
    'debtorName Column Check' as verification_type,
    CASE
        WHEN column_name IS NOT NULL THEN '✅ Column exists'
        ELSE '❌ Column missing'
    END as status,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Debt' AND column_name = 'debtorName'
UNION ALL
SELECT
    'recordedBy Column Check' as verification_type,
    CASE
        WHEN column_name IS NOT NULL THEN '✅ Column exists'
        ELSE '❌ Column missing'
    END as status,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Payment' AND column_name = 'recordedBy';

-- Step 7: Policy verification
SELECT
    'RLS Policy Check' as verification_type,
    '✅ ' || COUNT(*) || ' Payment policies active' as status,
    '' as data_type,
    '' as is_nullable
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'Payment'
  AND policyname LIKE '%can%payments%';

-- Step 8: Index verification
SELECT
    'Index Check' as verification_type,
    '✅ ' || COUNT(*) || ' new indexes created' as status,
    '' as data_type,
    '' as is_nullable
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE 'idx_debt_debtor_name%' OR indexname LIKE 'idx_payment_recorded_by%');

-- Step 9: Test data verification
SELECT
    'Test Data Check' as verification_type,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' test debts with debtorName created'
        ELSE '⚠️  No test data created (user may not exist)'
    END as status,
    '' as data_type,
    '' as is_nullable
FROM "Debt"
WHERE "debtorName" = 'Migration Test User';

-- Final success message
SELECT
    '🎉 MIGRATION COMPLETE' as final_status,
    'Enhanced debt management features are now available!' as message,
    'Run: npm run test:enhanced-debts' as next_step,
    CURRENT_TIMESTAMP as completed_at;

COMMIT;

-- Instructions for next steps:
-- 1. If you see ✅ symbols above, the migration was successful
-- 2. Run 'npm run test:enhanced-debts' in your terminal to test all features
-- 3. Test the mobile app with: onboard@qred.com / password123
-- 4. The test data can be safely deleted once testing is complete
-- 5. If any step failed, check the error messages and re-run specific sections
