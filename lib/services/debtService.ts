import { api } from './api';
import {
  Debt,
  CreateDebtRequest,
  UpdateDebtStatusRequest,
  InitializePaymentRequest,
  InitializePaymentResponse,
  Payment,
  DebtStatus
} from '@/lib/types';

class DebtService {
  /**
   * Get all debts where current user is the lender
   */
  async getLendingDebts(): Promise<Debt[]> {
    try {
      const response = await api.get<Debt[]>('/debts/lending');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all debts where current user is the debtor
   */
  async getOwingDebts(): Promise<Debt[]> {
    try {
      const response = await api.get<Debt[]>('/debts/owing');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific debt by ID
   */
  async getDebtById(debtId: string): Promise<Debt> {
    try {
      const response = await api.get<Debt>(`/debts/${debtId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new debt record
   */
  async createDebt(request: CreateDebtRequest): Promise<Debt> {
    try {
      const response = await api.post<Debt>('/debts', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a debt record
   */
  async updateDebt(debtId: string, data: Partial<Debt>): Promise<Debt> {
    try {
      const response = await api.patch<Debt>(`/debts/${debtId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update debt status (e.g., mark as paid)
   */
  async updateDebtStatus(
    debtId: string,
    request: UpdateDebtStatusRequest
  ): Promise<Debt> {
    try {
      const response = await api.patch<Debt>(`/debts/${debtId}/status`, request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a debt record
   */
  async deleteDebt(debtId: string): Promise<void> {
    try {
      await api.delete(`/debts/${debtId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment history for a debt
   */
  async getDebtPayments(debtId: string): Promise<Payment[]> {
    try {
      const response = await api.get<Payment[]>(`/debts/${debtId}/payments`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize payment for a debt
   */
  async initializePayment(
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    try {
      const response = await api.post<InitializePaymentResponse>(
        '/payments/initialize',
        request
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference: string): Promise<Payment> {
    try {
      const response = await api.get<Payment>(`/payments/verify/${reference}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get debt statistics/summary
   */
  async getDebtSummary(): Promise<{
    totalLending: number;
    totalOwing: number;
    activeDebts: number;
    overdueDebts: number;
    paidDebts: number;
  }> {
    try {
      const response = await api.get('/debts/summary');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send payment reminder for a debt
   */
  async sendPaymentReminder(debtId: string): Promise<void> {
    try {
      await api.post(`/debts/${debtId}/remind`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate interest for a debt
   */
  calculateInterest(
    principal: number,
    interestRate: number,
    startDate: Date,
    endDate?: Date
  ): number {
    const end = endDate || new Date();
    const timeDiff = end.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Simple interest calculation: (Principal × Rate × Time) / 100
    // Time is in days, so we divide by 365 for annual rate
    const interest = (principal * interestRate * daysDiff) / (100 * 365);

    return Math.round(interest * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate total amount (principal + interest)
   */
  calculateTotalAmount(
    principal: number,
    interestRate: number,
    startDate: Date,
    endDate?: Date
  ): number {
    const interest = this.calculateInterest(principal, interestRate, startDate, endDate);
    return principal + interest;
  }

  /**
   * Check if debt is overdue
   */
  isDebtOverdue(dueDate: string): boolean {
    const due = new Date(dueDate);
    const now = new Date();
    return now > due;
  }

  /**
   * Get days until due date
   */
  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const timeDiff = due.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Get days overdue
   */
  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const timeDiff = now.getTime() - due.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency = '₦'): string {
    return `${currency}${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Validate debt amount
   */
  validateAmount(amount: string | number): boolean {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= 10000000; // Max 10M
  }

  /**
   * Validate interest rate
   */
  validateInterestRate(rate: string | number): boolean {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return !isNaN(numRate) && numRate >= 0 && numRate <= 100;
  }

  /**
   * Validate due date
   */
  validateDueDate(dueDate: Date): boolean {
    const now = new Date();
    return dueDate > now;
  }

  /**
   * Get debt status color
   */
  getDebtStatusColor(status: DebtStatus): string {
    const colors = {
      PENDING: '#f59e0b', // Yellow
      PAID: '#10b981',    // Green
      OVERDUE: '#ef4444', // Red
      DEFAULTED: '#991b1b' // Dark red
    };
    return colors[status] || colors.PENDING;
  }

  /**
   * Get debt status text
   */
  getDebtStatusText(status: DebtStatus): string {
    const texts = {
      PENDING: 'Pending',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      DEFAULTED: 'Defaulted'
    };
    return texts[status] || 'Unknown';
  }

  /**
   * Search debts by query
   */
  async searchDebts(query: string, type: 'lending' | 'owing' | 'all' = 'all'): Promise<Debt[]> {
    try {
      const response = await api.get<Debt[]>('/debts/search', {
        params: { q: query, type }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export debts data
   */
  async exportDebts(format: 'csv' | 'pdf' = 'csv'): Promise<string> {
    try {
      const response = await api.get<{ downloadUrl: string }>('/debts/export', {
        params: { format }
      });
      return response.downloadUrl;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
export const debtService = new DebtService();
export default debtService;
