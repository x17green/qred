import { supabase, handleSupabaseError, getCurrentUser } from "./supabase";
import {
  DebtRow,
  DebtInsert,
  DebtUpdate,
  DebtWithRelations,
  PaymentRow,
  PaymentInsert,
  CreateDebtRequest,
  UpdateDebtStatusRequest,
  InitializePaymentRequest,
  InitializePaymentResponse,
  DebtSummary,
} from "../types/database";

class DebtService {
  private static instance: DebtService;

  public static getInstance(): DebtService {
    if (!DebtService.instance) {
      DebtService.instance = new DebtService();
    }
    return DebtService.instance;
  }

  // Get debts where current user is the lender
  async getLendingDebts(): Promise<DebtWithRelations[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .eq("lenderId", user.id)
        .order("createdAt", { ascending: false });

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations[];
    } catch (error) {
      console.error("Qred DebtService: Get lending debts error:", error);
      throw error;
    }
  }

  // Get debts where current user is the debtor
  async getOwingDebts(): Promise<DebtWithRelations[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .eq("debtorId", user.id)
        .order("createdAt", { ascending: false });

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations[];
    } catch (error) {
      console.error("Qred DebtService: Get owing debts error:", error);
      throw error;
    }
  }

  // Get all debts for the current user (both lending and owing)
  async getAllDebts(): Promise<{
    lendingDebts: DebtWithRelations[];
    owingDebts: DebtWithRelations[];
  }> {
    try {
      const [lendingDebts, owingDebts] = await Promise.all([
        this.getLendingDebts(),
        this.getOwingDebts(),
      ]);

      return {
        lendingDebts,
        owingDebts,
      };
    } catch (error) {
      console.error("Qred DebtService: Get all debts error:", error);
      throw error;
    }
  }

  // Get specific debt by ID
  async getDebtById(debtId: string): Promise<DebtWithRelations> {
    try {
      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .eq("id", debtId)
        .single();

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations;
    } catch (error) {
      console.error("Qred DebtService: Get debt by ID error:", error);
      throw error;
    }
  }

  // Create new debt
  async createDebt(request: CreateDebtRequest): Promise<DebtRow> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Calculate debt amounts
      const principal = request.principal;
      const interestRate = request.interestRate || 0;
      const calculatedInterest = (principal * interestRate) / 100;
      const totalAmount = principal + calculatedInterest;

      // Check if debtor exists by phone number
      let debtorId = null;
      const { data: existingDebtor } = await supabase
        .from("User")
        .select("id")
        .eq("phoneNumber", request.debtorPhoneNumber)
        .single();

      if (existingDebtor) {
        debtorId = existingDebtor.id;
      }

      const debtData: DebtInsert = {
        lenderId: user.id,
        debtorId,
        debtorPhoneNumber: request.debtorPhoneNumber,
        principalAmount: principal,
        interestRate,
        calculatedInterest,
        totalAmount,
        outstandingBalance: totalAmount,
        dueDate: request.dueDate,
        notes: request.notes || null,
        isExternal: request.isExternal || false,
        externalLenderName: request.externalLenderName || null,
        status: "PENDING",
      };

      const { data, error } = await supabase
        .from("Debt")
        .insert(debtData)
        .select()
        .single();

      if (error) handleSupabaseError(error);

      return data;
    } catch (error) {
      console.error("Qred DebtService: Create debt error:", error);
      throw error;
    }
  }

  // Update debt details
  async updateDebt(
    debtId: string,
    updates: Partial<DebtUpdate>,
  ): Promise<DebtRow> {
    try {
      const { data, error } = await supabase
        .from("Debt")
        .update(updates)
        .eq("id", debtId)
        .select()
        .single();

      if (error) handleSupabaseError(error);

      return data;
    } catch (error) {
      console.error("Qred DebtService: Update debt error:", error);
      throw error;
    }
  }

  // Update debt status
  async updateDebtStatus(
    debtId: string,
    request: UpdateDebtStatusRequest,
  ): Promise<DebtRow> {
    try {
      const updates: Partial<DebtUpdate> = {
        status: request.status,
      };

      if (request.status === "PAID") {
        updates.paidAt = new Date().toISOString();
        updates.outstandingBalance = 0;
      }

      return await this.updateDebt(debtId, updates);
    } catch (error) {
      console.error("Qred DebtService: Update debt status error:", error);
      throw error;
    }
  }

  // Delete debt
  async deleteDebt(debtId: string): Promise<void> {
    try {
      const { error } = await supabase.from("Debt").delete().eq("id", debtId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error("Qred DebtService: Delete debt error:", error);
      throw error;
    }
  }

  // Get user's debt summary
  async getDebtSummary(): Promise<DebtSummary> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .rpc("get_user_debt_summary", {
          user_id: user.id,
        })
        .single();

      if (error) handleSupabaseError(error);

      return data;
    } catch (error) {
      console.error("Qred DebtService: Get debt summary error:", error);
      // Return default values if function doesn't exist yet
      return {
        total_lending: 0,
        total_owing: 0,
        overdue_count: 0,
        pending_count: 0,
      };
    }
  }

  // Initialize payment
  async initializePayment(
    request: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse> {
    try {
      // Note: This would typically call a payment gateway API
      // For now, we'll return a mock response
      // In production, this should be handled by an Edge Function

      const reference = `qred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      const paymentData: PaymentInsert = {
        debtId: request.debtId,
        amount: request.amount,
        reference,
        gateway: "paystack", // or "flutterwave"
        status: "PENDING",
        paidAt: new Date().toISOString(),
      };

      const { data: payment, error } = await supabase
        .from("Payment")
        .insert(paymentData)
        .select()
        .single();

      if (error) handleSupabaseError(error);

      // Mock response - in production, this would come from payment gateway
      return {
        authorization_url: `https://checkout.paystack.com/${reference}`,
        access_code: `access_${reference}`,
        reference,
      };
    } catch (error) {
      console.error("Qred DebtService: Initialize payment error:", error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(reference: string): Promise<PaymentRow> {
    try {
      const { data, error } = await supabase
        .from("Payment")
        .select("*")
        .eq("reference", reference)
        .single();

      if (error) handleSupabaseError(error);

      return data;
    } catch (error) {
      console.error("Qred DebtService: Verify payment error:", error);
      throw error;
    }
  }

  // Send payment reminder (placeholder - would integrate with notification service)
  async sendPaymentReminder(debtId: string): Promise<void> {
    try {
      // Get debt details
      const debt = await this.getDebtById(debtId);

      // Note: In production, this would integrate with:
      // - SMS service (Twilio, Termii)
      // - Email service (SendGrid, Resend)
      // - Push notifications (Expo Notifications)

      console.log(`Qred: Payment reminder sent for debt ${debtId}`, {
        amount: debt.outstandingBalance,
        debtor: debt.debtor?.name || debt.debtorPhoneNumber,
        dueDate: debt.dueDate,
      });

      // For now, we'll just log the reminder
      // In production, implement actual notification sending
    } catch (error) {
      console.error("Qred DebtService: Send payment reminder error:", error);
      throw error;
    }
  }

  // Search debts
  async searchDebts(query: string): Promise<DebtWithRelations[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .or(
          `
          lenderId.eq.${user.id},
          debtorId.eq.${user.id}
        `,
        )
        .or(
          `
          notes.ilike.%${query}%,
          debtorPhoneNumber.ilike.%${query}%,
          externalLenderName.ilike.%${query}%
        `,
        )
        .order("createdAt", { ascending: false });

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations[];
    } catch (error) {
      console.error("Qred DebtService: Search debts error:", error);
      throw error;
    }
  }

  // Get overdue debts
  async getOverdueDebts(): Promise<DebtWithRelations[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .or(
          `
          lenderId.eq.${user.id},
          debtorId.eq.${user.id}
        `,
        )
        .eq("status", "PENDING")
        .lt("dueDate", now)
        .order("dueDate", { ascending: true });

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations[];
    } catch (error) {
      console.error("Qred DebtService: Get overdue debts error:", error);
      throw error;
    }
  }

  // Get pending debts
  async getPendingDebts(): Promise<DebtWithRelations[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("Debt")
        .select(
          `
          *,
          lender:User!lenderId(*),
          debtor:User!debtorId(*),
          payments:Payment(*)
        `,
        )
        .or(
          `
          lenderId.eq.${user.id},
          debtorId.eq.${user.id}
        `,
        )
        .eq("status", "PENDING")
        .order("dueDate", { ascending: true });

      if (error) handleSupabaseError(error);

      return data as DebtWithRelations[];
    } catch (error) {
      console.error("Qred DebtService: Get pending debts error:", error);
      throw error;
    }
  }

  // Subscribe to debt changes (real-time)
  subscribeToDebtChanges(callback: (payload: any) => void) {
    return supabase
      .channel("debt-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Debt",
        },
        callback,
      )
      .subscribe();
  }

  // Subscribe to payment changes (real-time)
  subscribeToPaymentChanges(callback: (payload: any) => void) {
    return supabase
      .channel("payment-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Payment",
        },
        callback,
      )
      .subscribe();
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = "NGN"): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getDebtStatusColor(status: string): string {
    switch (status) {
      case "PENDING":
        return "#f59e0b"; // amber-500
      case "PAID":
        return "#10b981"; // emerald-500
      case "OVERDUE":
        return "#ef4444"; // red-500
      case "DEFAULTED":
        return "#991b1b"; // red-800
      default:
        return "#6b7280"; // gray-500
    }
  }

  getDebtStatusText(status: string): string {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "PAID":
        return "Paid";
      case "OVERDUE":
        return "Overdue";
      case "DEFAULTED":
        return "Defaulted";
      default:
        return "Unknown";
    }
  }

  calculateInterest(principal: number, rate: number, days: number): number {
    return ((principal * rate) / 100) * (days / 365);
  }

  isDebtOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const debtService = DebtService.getInstance();
export default debtService;
