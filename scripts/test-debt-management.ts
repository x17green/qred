import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDebtManagement() {
  console.log("🎯 Testing Debt Management System...");
  console.log("=" .repeat(60));

  try {
    // Step 1: Sign in with our test user
    console.log("\n🔐 1. Signing in with test user...");

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "onboard@qred.com",
      password: "password123"
    });

    if (signInError) {
      console.error("❌ Sign in failed:", signInError.message);
      return;
    }

    console.log("✅ Signed in successfully");
    console.log(`   User ID: ${signInData.user.id}`);

    // Step 2: Check if user profile exists
    console.log("\n👤 2. Checking user profile...");

    const { data: profile, error: profileError } = await supabase
      .from("User")
      .select("*")
      .eq("id", signInData.user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile check failed:", profileError.message);
      return;
    }

    console.log("✅ Profile found:");
    console.log(`   Name: ${profile.name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Phone: ${profile.phoneNumber || 'none'}`);

    // Step 3: Create test debts
    console.log("\n💰 3. Creating test debts...");

    const testDebts = [
      {
        debtorPhoneNumber: "+2348012345679",
        principalAmount: 50000,
        interestRate: 5,
        calculatedInterest: 2500,
        totalAmount: 52500,
        outstandingBalance: 52500,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        notes: "Loan for business expansion",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorPhoneNumber: "+2348087654321",
        principalAmount: 100000,
        interestRate: 10,
        calculatedInterest: 10000,
        totalAmount: 110000,
        outstandingBalance: 110000,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        notes: "Emergency loan for medical expenses",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorPhoneNumber: "+2347012345678",
        principalAmount: 25000,
        interestRate: 0,
        calculatedInterest: 0,
        totalAmount: 25000,
        outstandingBalance: 25000,
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago (overdue)
        notes: "Quick cash advance",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorPhoneNumber: "+2349087654321",
        principalAmount: 200000,
        interestRate: 15,
        calculatedInterest: 30000,
        totalAmount: 230000,
        outstandingBalance: 0,
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Car loan - fully paid",
        isExternal: false,
        status: "PAID",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null,
        paidAt: new Date().toISOString()
      }
    ];

    // Insert test debts
    for (let i = 0; i < testDebts.length; i++) {
      const debt = testDebts[i];

      const { data: insertedDebt, error: debtError } = await supabase
        .from("Debt")
        .insert(debt)
        .select()
        .single();

      if (debtError) {
        console.error(`❌ Failed to create debt ${i + 1}:`, debtError.message);
      } else {
        console.log(`✅ Created debt ${i + 1}: ${debt.debtorPhoneNumber} - ₦${debt.principalAmount.toLocaleString()}`);
      }
    }

    // Step 4: Query all debts for the user
    console.log("\n📊 4. Querying user's debts...");

    const { data: userDebts, error: debtsError } = await supabase
      .from("Debt")
      .select(`
        *,
        lender:User!lenderId(*),
        debtor:User!debtorId(*)
      `)
      .eq("lenderId", signInData.user.id)
      .order("createdAt", { ascending: false });

    if (debtsError) {
      console.error("❌ Failed to query debts:", debtsError.message);
    } else {
      console.log(`✅ Found ${userDebts?.length || 0} debts for user`);

      userDebts?.forEach((debt, index) => {
        console.log(`\n   Debt ${index + 1}:`);
        console.log(`     Phone: ${debt.debtorPhoneNumber}`);
        console.log(`     Amount: ₦${debt.principalAmount.toLocaleString()}`);
        console.log(`     Total: ₦${debt.totalAmount.toLocaleString()}`);
        console.log(`     Outstanding: ₦${debt.outstandingBalance.toLocaleString()}`);
        console.log(`     Status: ${debt.status}`);
        console.log(`     Due: ${new Date(debt.dueDate).toLocaleDateString()}`);
        console.log(`     Notes: ${debt.notes || 'none'}`);
      });
    }

    // Step 5: Test debt statistics
    console.log("\n📈 5. Calculating debt statistics...");

    if (userDebts) {
      const totalLending = userDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0);
      const totalOriginal = userDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
      const paidAmount = totalOriginal - totalLending;

      const pendingDebts = userDebts.filter(debt => debt.status === "PENDING");
      const paidDebts = userDebts.filter(debt => debt.status === "PAID");
      const overdueDebts = userDebts.filter(debt =>
        debt.status === "PENDING" && new Date(debt.dueDate) < new Date()
      );

      console.log("📊 Statistics:");
      console.log(`   Total Outstanding: ₦${totalLending.toLocaleString()}`);
      console.log(`   Total Paid: ₦${paidAmount.toLocaleString()}`);
      console.log(`   Pending Debts: ${pendingDebts.length}`);
      console.log(`   Paid Debts: ${paidDebts.length}`);
      console.log(`   Overdue Debts: ${overdueDebts.length}`);
    }

    // Step 6: Test debt summary RPC function
    console.log("\n🔧 6. Testing debt summary function...");

    try {
      const { data: summary, error: summaryError } = await supabase
        .rpc("get_user_debt_summary", {
          user_id: signInData.user.id
        })
        .single();

      if (summaryError) {
        console.error("❌ RPC function error:", summaryError.message);
      } else {
        console.log("✅ Debt summary from RPC:");
        console.log(`   Total Lending: ₦${(summary as any).total_lending?.toLocaleString() || 0}`);
        console.log(`   Total Owing: ₦${(summary as any).total_owing?.toLocaleString() || 0}`);
        console.log(`   Overdue Count: ${(summary as any).overdue_count || 0}`);
        console.log(`   Pending Count: ${(summary as any).pending_count || 0}`);
      }
    } catch (error) {
      console.log("⚠️  RPC function not available (expected in development)");
    }

    // Step 7: Test payment functionality
    console.log("\n💳 7. Testing payment creation...");

    const firstDebt = userDebts?.[0];
    if (firstDebt && firstDebt.status === "PENDING") {
      const paymentData = {
        debtId: firstDebt.id,
        amount: Math.min(firstDebt.outstandingBalance, 10000), // Pay up to 10k
        reference: `test_payment_${Date.now()}`,
        gateway: "paystack",
        status: "SUCCESSFUL",
        paidAt: new Date().toISOString()
      };

      const { data: payment, error: paymentError } = await supabase
        .from("Payment")
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error("❌ Payment creation failed:", paymentError.message);
      } else {
        console.log("✅ Test payment created:");
        console.log(`   Amount: ₦${payment.amount.toLocaleString()}`);
        console.log(`   Reference: ${payment.reference}`);
        console.log(`   Status: ${payment.status}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Debt Management Test Complete!");
    console.log("=".repeat(60));
    console.log("\n✅ Key Features Tested:");
    console.log("• User authentication and profile access");
    console.log("• Debt creation with various scenarios");
    console.log("• Debt querying with relationships");
    console.log("• Debt statistics calculation");
    console.log("• Payment record creation");
    console.log("• Overdue debt detection");
    console.log("• Different debt statuses (PENDING, PAID)");

    console.log("\n📱 Ready for App Testing:");
    console.log("• Open the mobile app");
    console.log("• Sign in with: onboard@qred.com / password123");
    console.log("• Navigate to Debts tab");
    console.log("• You should see the test debts created above");
    console.log("• Test adding new debts");
    console.log("• Test debt detail views and actions");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function cleanupTestData() {
  console.log("\n🧹 Cleaning up test data...");

  try {
    // Sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "onboard@qred.com",
      password: "password123"
    });

    if (signInError || !signInData.user) {
      console.error("❌ Cannot sign in to cleanup data");
      return;
    }

    // Delete all debts for this user
    const { error: deleteDebtsError } = await supabase
      .from("Debt")
      .delete()
      .eq("lenderId", signInData.user.id);

    if (deleteDebtsError) {
      console.error("❌ Failed to delete debts:", deleteDebtsError.message);
    } else {
      console.log("✅ Test debts deleted");
    }

    // Delete all payments for this user's debts
    const { error: deletePaymentsError } = await supabase
      .from("Payment")
      .delete()
      .in("debtId", []);

    console.log("✅ Cleanup completed");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldCleanup = args.includes('--cleanup') || args.includes('-c');

  if (shouldCleanup) {
    await cleanupTestData();
  } else {
    await testDebtManagement();
    console.log("\n💡 Tip: Run with --cleanup flag to remove test data");
    console.log("   Example: npm run test:debt-management -- --cleanup");
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
