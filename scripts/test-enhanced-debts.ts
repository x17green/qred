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

async function testEnhancedDebtManagement() {
  console.log("🚀 Testing Enhanced Debt Management Features...");
  console.log("=" .repeat(70));

  try {
    // Step 1: Sign in with test user
    console.log("\n🔐 1. Signing in with test user...");

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "onboard@qred.com",
      password: "password123"
    });

    if (signInError || !signInData.user) {
      console.error("❌ Sign in failed:", signInError?.message);
      return;
    }

    console.log("✅ Signed in successfully");
    console.log(`   User ID: ${signInData.user.id}`);

    // Step 2: Clean up existing test debts
    console.log("\n🧹 2. Cleaning up existing test data...");

    const { error: deleteError } = await supabase
      .from("Debt")
      .delete()
      .eq("lenderId", signInData.user.id);

    if (deleteError) {
      console.log("⚠️  Error cleaning up:", deleteError.message);
    } else {
      console.log("✅ Previous test data cleaned up");
    }

    // Step 3: Create enhanced debts with debtor names
    console.log("\n💰 3. Creating enhanced debts with debtor names...");

    const enhancedDebts = [
      {
        debtorName: "John Smith",
        debtorPhoneNumber: "+2348012345678",
        principalAmount: 75000,
        interestRate: 8,
        calculatedInterest: 6000,
        totalAmount: 81000,
        outstandingBalance: 81000,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Business loan for inventory purchase",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorName: "Mary Johnson",
        debtorPhoneNumber: "+2348087654321",
        principalAmount: 120000,
        interestRate: 12,
        calculatedInterest: 14400,
        totalAmount: 134400,
        outstandingBalance: 134400,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Personal loan for home improvement",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorName: "Ahmed Hassan",
        debtorPhoneNumber: "+2347012345678",
        principalAmount: 50000,
        interestRate: 5,
        calculatedInterest: 2500,
        totalAmount: 52500,
        outstandingBalance: 30000, // Partially paid
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
        notes: "Emergency cash advance",
        isExternal: false,
        status: "PENDING",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null
      },
      {
        debtorName: "Sarah Williams",
        debtorPhoneNumber: "+2349087654321",
        principalAmount: 200000,
        interestRate: 15,
        calculatedInterest: 30000,
        totalAmount: 230000,
        outstandingBalance: 0,
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Equipment financing - fully settled",
        isExternal: false,
        status: "PAID",
        lenderId: signInData.user.id,
        debtorId: null,
        externalLenderName: null,
        paidAt: new Date().toISOString()
      }
    ];

    // Insert enhanced debts
    const createdDebts = [];
    for (let i = 0; i < enhancedDebts.length; i++) {
      const debt = enhancedDebts[i];

      const { data: insertedDebt, error: debtError } = await supabase
        .from("Debt")
        .insert(debt)
        .select()
        .single();

      if (debtError) {
        console.error(`❌ Failed to create debt ${i + 1}:`, debtError.message);
      } else {
        console.log(`✅ Created debt ${i + 1}: ${debt.debtorName} - ₦${debt.principalAmount.toLocaleString()}`);
        createdDebts.push(insertedDebt);
      }
    }

    // Step 4: Test search functionality with debtor names
    console.log("\n🔍 4. Testing enhanced search functionality...");

    const searchTests = [
      { query: "john", expectedName: "John Smith" },
      { query: "mary", expectedName: "Mary Johnson" },
      { query: "+234801", expectedName: "John Smith" },
      { query: "business", expectedNote: "Business loan" },
      { query: "ahmed", expectedName: "Ahmed Hassan" }
    ];

    for (const test of searchTests) {
      const { data: searchResults } = await supabase
        .from("Debt")
        .select("*")
        .eq("lenderId", signInData.user.id)
        .or(`
          debtorName.ilike.%${test.query}%,
          debtorPhoneNumber.ilike.%${test.query}%,
          notes.ilike.%${test.query}%
        `);

      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Search "${test.query}": Found ${searchResults.length} result(s)`);
        searchResults.forEach(result => {
          console.log(`   - ${result.debtorName} (${result.debtorPhoneNumber})`);
        });
      } else {
        console.log(`⚠️  Search "${test.query}": No results found`);
      }
    }

    // Step 5: Test payment recording functionality
    console.log("\n💳 5. Testing payment recording functionality...");

    const debtWithBalance = createdDebts.find(debt => debt.outstandingBalance > 0);
    if (debtWithBalance) {
      console.log(`📝 Recording payment for: ${debtWithBalance.debtorName}`);

      // Record a partial payment
      const paymentAmount = 25000;
      const paymentData = {
        debtId: debtWithBalance.id,
        amount: paymentAmount,
        reference: `manual_${Date.now()}_${signInData.user.id.slice(-8)}`,
        gateway: "manual",
        status: "SUCCESSFUL",
        paidAt: new Date().toISOString(),
        recordedBy: signInData.user.id
      };

      const { data: payment, error: paymentError } = await supabase
        .from("Payment")
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error("❌ Payment recording failed:", paymentError.message);
      } else {
        console.log("✅ Payment recorded successfully:");
        console.log(`   Amount: ₦${payment.amount.toLocaleString()}`);
        console.log(`   Reference: ${payment.reference}`);
        console.log(`   Gateway: ${payment.gateway}`);

        // Update debt balance
        const newBalance = debtWithBalance.outstandingBalance - paymentAmount;
        const { error: updateError } = await supabase
          .from("Debt")
          .update({ outstandingBalance: newBalance })
          .eq("id", debtWithBalance.id);

        if (updateError) {
          console.error("❌ Failed to update debt balance:", updateError.message);
        } else {
          console.log(`✅ Updated debt balance: ₦${newBalance.toLocaleString()}`);
        }
      }

      // Test payment history retrieval
      console.log("\n📊 Testing payment history retrieval...");
      const { data: payments, error: historyError } = await supabase
        .from("Payment")
        .select("*")
        .eq("debtId", debtWithBalance.id)
        .order("paidAt", { ascending: false });

      if (historyError) {
        console.error("❌ Failed to retrieve payment history:", historyError.message);
      } else {
        console.log(`✅ Payment history retrieved: ${payments?.length || 0} payments`);
        payments?.forEach((payment, index) => {
          console.log(`   ${index + 1}. ₦${payment.amount.toLocaleString()} - ${payment.gateway} - ${new Date(payment.paidAt).toLocaleDateString()}`);
        });
      }
    }

    // Step 6: Test debtor name prioritization
    console.log("\n👤 6. Testing debtor name prioritization...");

    const debtsWithNames = await supabase
      .from("Debt")
      .select("*")
      .eq("lenderId", signInData.user.id)
      .not("debtorName", "is", null);

    if (debtsWithNames.data) {
      console.log("✅ Debts with custom names:");
      debtsWithNames.data.forEach((debt, index) => {
        console.log(`   ${index + 1}. ${debt.debtorName} (${debt.debtorPhoneNumber})`);
        console.log(`      Amount: ₦${debt.outstandingBalance.toLocaleString()}`);
        console.log(`      Status: ${debt.status}`);
      });
    }

    // Step 7: Test statistics with enhanced data
    console.log("\n📈 7. Calculating enhanced debt statistics...");

    const { data: allDebts } = await supabase
      .from("Debt")
      .select("*")
      .eq("lenderId", signInData.user.id);

    if (allDebts) {
      const totalOutstanding = allDebts.reduce((sum, debt) => sum + debt.outstandingBalance, 0);
      const totalOriginal = allDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
      const totalPaid = totalOriginal - totalOutstanding;

      const pendingDebts = allDebts.filter(debt => debt.status === "PENDING");
      const paidDebts = allDebts.filter(debt => debt.status === "PAID");
      const overdueDebts = allDebts.filter(debt =>
        debt.status === "PENDING" && new Date(debt.dueDate) < new Date()
      );

      const debtsWithNames = allDebts.filter(debt => debt.debtorName);
      const debtsWithPayments = await supabase
        .from("Payment")
        .select("debtId")
        .in("debtId", allDebts.map(d => d.id));

      console.log("📊 Enhanced Statistics:");
      console.log(`   Total Outstanding: ₦${totalOutstanding.toLocaleString()}`);
      console.log(`   Total Paid: ₦${totalPaid.toLocaleString()}`);
      console.log(`   Pending Debts: ${pendingDebts.length}`);
      console.log(`   Paid Debts: ${paidDebts.length}`);
      console.log(`   Overdue Debts: ${overdueDebts.length}`);
      console.log(`   Debts with Names: ${debtsWithNames.length}/${allDebts.length}`);
      console.log(`   Debts with Payment History: ${new Set(debtsWithPayments.data?.map(p => p.debtId)).size}`);

      // Most active debtors
      const debtorStats = allDebts.reduce((acc: any, debt) => {
        const name = debt.debtorName || debt.debtorPhoneNumber;
        if (!acc[name]) {
          acc[name] = { count: 0, totalAmount: 0, outstanding: 0 };
        }
        acc[name].count++;
        acc[name].totalAmount += debt.totalAmount;
        acc[name].outstanding += debt.outstandingBalance;
        return acc;
      }, {});

      console.log("\n👥 Top Debtors:");
      Object.entries(debtorStats)
        .sort(([,a]: any, [,b]: any) => b.outstanding - a.outstanding)
        .slice(0, 3)
        .forEach(([name, stats]: any, index) => {
          console.log(`   ${index + 1}. ${name}`);
          console.log(`      Debts: ${stats.count}, Outstanding: ₦${stats.outstanding.toLocaleString()}`);
        });
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Enhanced Debt Management Test Complete!");
    console.log("=".repeat(70));

    console.log("\n✅ Enhanced Features Tested:");
    console.log("• Debtor name field for better identification");
    console.log("• Enhanced search by name, phone, and notes");
    console.log("• Payment recording with manual entry support");
    console.log("• Payment history tracking and display");
    console.log("• Debtor name prioritization in display logic");
    console.log("• Enhanced statistics and reporting");

    console.log("\n📱 Ready for Enhanced App Testing:");
    console.log("• Open the mobile app");
    console.log("• Sign in with: onboard@qred.com / password123");
    console.log("• Navigate to Debts tab");
    console.log("• Test search functionality with debtor names");
    console.log("• View debt details and payment history");
    console.log("• Test recording payments for pending debts");
    console.log("• Verify debtor names display correctly");

    console.log("\n🔍 Test Data Created:");
    console.log("• John Smith - ₦75,000 (business loan)");
    console.log("• Mary Johnson - ₦120,000 (home improvement)");
    console.log("• Ahmed Hassan - ₦30,000 outstanding (overdue)");
    console.log("• Sarah Williams - Fully paid equipment loan");

  } catch (error) {
    console.error("❌ Enhanced debt management test failed:", error);
  }
}

async function cleanupEnhancedTestData() {
  console.log("\n🧹 Cleaning up enhanced test data...");

  try {
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: "onboard@qred.com",
      password: "password123"
    });

    if (!signInData.user) {
      console.error("❌ Cannot sign in to cleanup data");
      return;
    }

    // Get all test debts
    const { data: debts } = await supabase
      .from("Debt")
      .select("id")
      .eq("lenderId", signInData.user.id);

    if (debts && debts.length > 0) {
      // Delete all payments for these debts
      const debtIds = debts.map(d => d.id);

      const { error: deletePaymentsError } = await supabase
        .from("Payment")
        .delete()
        .in("debtId", debtIds);

      if (deletePaymentsError) {
        console.error("❌ Failed to delete payments:", deletePaymentsError.message);
      } else {
        console.log("✅ Test payments deleted");
      }

      // Delete all debts
      const { error: deleteDebtsError } = await supabase
        .from("Debt")
        .delete()
        .eq("lenderId", signInData.user.id);

      if (deleteDebtsError) {
        console.error("❌ Failed to delete debts:", deleteDebtsError.message);
      } else {
        console.log("✅ Test debts deleted");
      }
    }

    console.log("✅ Enhanced test data cleanup completed");

  } catch (error) {
    console.error("❌ Enhanced cleanup failed:", error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldCleanup = args.includes('--cleanup') || args.includes('-c');

  if (shouldCleanup) {
    await cleanupEnhancedTestData();
  } else {
    await testEnhancedDebtManagement();
    console.log("\n💡 Tip: Run with --cleanup flag to remove test data");
    console.log("   Example: npm run test:enhanced-debts -- --cleanup");
  }
}

main().catch((error) => {
  console.error("❌ Enhanced test script failed:", error);
  process.exit(1);
});
