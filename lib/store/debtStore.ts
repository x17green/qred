import { debtService } from "@/lib/services/debtService";
import { DebtRow, DebtWithRelations } from "@/lib/types/database";
import {
    CreateDebtRequest,
    Debt,
    DebtActions,
    DebtState,
    Payment,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

interface DebtStore extends DebtState, DebtActions {
  // Additional debt actions
  fetchLendingDebts: () => Promise<DebtWithRelations[]>;
  fetchOwingDebts: () => Promise<DebtWithRelations[]>;
  fetchAllDebts: () => Promise<{
    lendingDebts: DebtWithRelations[];
    owingDebts: DebtWithRelations[];
  }>;
  fetchDebtById: (debtId: string) => Promise<DebtWithRelations>;
  createDebt: (request: CreateDebtRequest) => Promise<DebtRow>;
  updateDebtDetails: (debtId: string, data: Partial<Debt>) => Promise<DebtRow>;
  markDebtAsPaid: (debtId: string) => Promise<DebtRow>;
  deleteDebt: (debtId: string) => Promise<void>;
  recordPayment: (debtId: string, amount: number, notes?: string) => Promise<Payment>;
  initializePayment: (
    debtId: string,
    amount: number,
    email: string,
  ) => Promise<any>;
  verifyPayment: (reference: string) => Promise<Payment>;
  sendPaymentReminder: (debtId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  // Search function
  searchDebts: (query: string) => Debt[];
}

export const useDebtStore = create<DebtStore>()(
  persist(
    (set, get) => ({
      // State
      lendingDebts: [],
      owingDebts: [],
      currentDebt: null,
      isLoading: false,
      error: null,

      // Actions
      setLendingDebts: (debts: Debt[]) => {
        set({ lendingDebts: debts as any, error: null });
      },

      setOwingDebts: (debts: Debt[]) => {
        set({ owingDebts: debts as any, error: null });
      },

      setCurrentDebt: (debt: Debt | null) => {
        set({ currentDebt: debt as any, error: null });
      },

      addDebt: (debt: Debt) => {
        const { lendingDebts } = get();
        set({
          lendingDebts: [debt as any, ...lendingDebts],
          error: null,
        });
      },

      updateDebt: (updatedDebt: Debt) => {
        const { lendingDebts, owingDebts, currentDebt } = get();

        const newLendingDebts = lendingDebts.map((debt) =>
          debt.id === updatedDebt.id ? updatedDebt : debt,
        );

        const newOwingDebts = owingDebts.map((debt) =>
          debt.id === updatedDebt.id ? updatedDebt : debt,
        );

        set({
          lendingDebts: newLendingDebts as any,
          owingDebts: newOwingDebts as any,
          currentDebt:
            currentDebt?.id === updatedDebt.id
              ? (updatedDebt as any)
              : currentDebt,
          error: null,
        });
      },

      removeDebt: (debtId: string) => {
        const { lendingDebts, owingDebts, currentDebt } = get();

        const newLendingDebts = lendingDebts.filter(
          (debt) => debt.id !== debtId,
        );
        const newOwingDebts = owingDebts.filter((debt) => debt.id !== debtId);

        set({
          lendingDebts: newLendingDebts as any,
          owingDebts: newOwingDebts as any,
          currentDebt: currentDebt?.id === debtId ? null : currentDebt,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Additional debt actions
      fetchLendingDebts: async () => {
        try {
          set({ isLoading: true, error: null });

          const debts = await debtService.getLendingDebts();

          set({
            lendingDebts: debts as any,
            isLoading: false,
            error: null,
          });

          return debts;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch lending debts";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchOwingDebts: async () => {
        try {
          set({ isLoading: true, error: null });

          const debts = await debtService.getOwingDebts();

          set({
            owingDebts: debts as any,
            isLoading: false,
            error: null,
          });

          return debts;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch owing debts";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchAllDebts: async () => {
        try {
          set({ isLoading: true, error: null });

          const [lendingDebts, owingDebts] = await Promise.all([
            debtService.getLendingDebts(),
            debtService.getOwingDebts(),
          ]);

          set({
            lendingDebts: lendingDebts as any,
            owingDebts: owingDebts as any,
            isLoading: false,
            error: null,
          });

          return { lendingDebts, owingDebts };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch debts";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchDebtById: async (debtId: string) => {
        try {
          set({ isLoading: true, error: null });

          const debt = await debtService.getDebtById(debtId);

          set({
            currentDebt: debt as any,
            isLoading: false,
            error: null,
          });

          return debt;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch debt details";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      createDebt: async (request: CreateDebtRequest) => {
        try {
          set({ isLoading: true, error: null });

          const newDebt = await debtService.createDebt(request);

          const { lendingDebts } = get();
          set({
            lendingDebts: [newDebt as any, ...lendingDebts],
            isLoading: false,
            error: null,
          });

          return newDebt;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create debt";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateDebtDetails: async (debtId: string, data: Partial<Debt>) => {
        try {
          set({ isLoading: true, error: null });

          const updatedDebt = await debtService.updateDebt(debtId, data);

          // Update debt in both arrays and current debt
          const { lendingDebts, owingDebts, currentDebt } = get();

          const newLendingDebts = lendingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          const newOwingDebts = owingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          set({
            lendingDebts: newLendingDebts as any,
            owingDebts: newOwingDebts as any,
            currentDebt:
              currentDebt?.id === debtId ? (updatedDebt as any) : currentDebt,
            isLoading: false,
            error: null,
          });

          return updatedDebt;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update debt";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      markDebtAsPaid: async (debtId: string) => {
        try {
          set({ isLoading: true, error: null });

          const updatedDebt = await debtService.updateDebtStatus(debtId, {
            status: "PAID",
          });

          // Update debt status in store
          const { lendingDebts, owingDebts, currentDebt } = get();

          const newLendingDebts = lendingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          const newOwingDebts = owingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          set({
            lendingDebts: newLendingDebts as any,
            owingDebts: newOwingDebts as any,
            currentDebt:
              currentDebt?.id === debtId ? (updatedDebt as any) : currentDebt,
            isLoading: false,
            error: null,
          });

          return updatedDebt;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to mark debt as paid";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deleteDebt: async (debtId: string) => {
        try {
          set({ isLoading: true, error: null });

          await debtService.deleteDebt(debtId);

          // Remove debt from store
          const { lendingDebts, owingDebts, currentDebt } = get();

          const newLendingDebts = lendingDebts.filter(
            (debt) => debt.id !== debtId,
          );
          const newOwingDebts = owingDebts.filter((debt) => debt.id !== debtId);

          set({
            lendingDebts: newLendingDebts as any,
            owingDebts: newOwingDebts as any,
            currentDebt: currentDebt?.id === debtId ? null : currentDebt,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete debt";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      initializePayment: async (
        debtId: string,
        amount: number,
        email: string,
      ) => {
        try {
          set({ isLoading: true, error: null });

          const paymentResponse = await debtService.initializePayment({
            debtId,
            amount,
            email,
          });

          set({ isLoading: false, error: null });

          return paymentResponse;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to initialize payment";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      verifyPayment: async (reference: string) => {
        try {
          set({ isLoading: true, error: null });

          const payment = await debtService.verifyPayment(reference);

          // If payment is successful, refresh the related debt
          if (payment.status === "SUCCESSFUL" && payment.debtId) {
            const updatedDebt = await debtService.getDebtById(payment.debtId);

            const { lendingDebts, owingDebts, currentDebt } = get();

            const newLendingDebts = lendingDebts.map((debt) =>
              debt.id === payment.debtId ? updatedDebt : debt,
            );

            const newOwingDebts = owingDebts.map((debt) =>
              debt.id === payment.debtId ? updatedDebt : debt,
            );

            set({
              lendingDebts: newLendingDebts as any,
              owingDebts: newOwingDebts as any,
              currentDebt:
                currentDebt?.id === payment.debtId
                  ? (updatedDebt as any)
                  : currentDebt,
              isLoading: false,
              error: null,
            });
          } else {
            set({ isLoading: false, error: null });
          }

          return payment;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to verify payment";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      sendPaymentReminder: async (debtId: string) => {
        try {
          set({ isLoading: true, error: null });

          await debtService.sendPaymentReminder(debtId);

          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to send payment reminder";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      recordPayment: async (debtId: string, amount: number, notes?: string) => {
        try {
          set({ isLoading: true, error: null });

          const payment = await debtService.recordPayment(debtId, amount, notes);

          // Refresh the debt data after recording payment
          const updatedDebt = await debtService.getDebtById(debtId);

          const { lendingDebts, owingDebts, currentDebt } = get();

          const newLendingDebts = lendingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          const newOwingDebts = owingDebts.map((debt) =>
            debt.id === debtId ? updatedDebt : debt,
          );

          set({
            lendingDebts: newLendingDebts as any,
            owingDebts: newOwingDebts as any,
            currentDebt:
              currentDebt?.id === debtId ? (updatedDebt as any) : currentDebt,
            isLoading: false,
            error: null,
          });

          return payment;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to record payment";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          lendingDebts: [],
          owingDebts: [],
          currentDebt: null,
          isLoading: false,
          error: null,
        });
      },

      // Search function (not computed)
      searchDebts: (query: string) => {
        const { lendingDebts, owingDebts } = get();
        const allDebts = [...lendingDebts, ...owingDebts];

        const lowercaseQuery = query.toLowerCase();

        return allDebts.filter(
          (debt) =>
            debt.debtor?.name?.toLowerCase().includes(lowercaseQuery) ||
            debt.lender?.name?.toLowerCase().includes(lowercaseQuery) ||
            debt.debtorPhoneNumber.includes(query) ||
            debt.notes?.toLowerCase().includes(lowercaseQuery) ||
            debt.externalLenderName?.toLowerCase().includes(lowercaseQuery),
        );
      },
    }),
    {
      name: "debt-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lendingDebts: state.lendingDebts,
        owingDebts: state.owingDebts,
      }),
    },
  ),
);

// Selectors for easier component usage
export const useDebts = () =>
  useDebtStore(
    useShallow((state) => ({
      lendingDebts: state.lendingDebts,
      owingDebts: state.owingDebts,
      currentDebt: state.currentDebt,
      isLoading: state.isLoading,
      error: state.error,
    })),
  );

export const useDebtActions = () =>
  useDebtStore(
    useShallow((state) => ({
      setLendingDebts: state.setLendingDebts,
      setOwingDebts: state.setOwingDebts,
      setCurrentDebt: state.setCurrentDebt,
      addDebt: state.addDebt,
      updateDebt: state.updateDebt,
      removeDebt: state.removeDebt,
      fetchLendingDebts: state.fetchLendingDebts,
      fetchOwingDebts: state.fetchOwingDebts,
      fetchAllDebts: state.fetchAllDebts,
      fetchDebtById: state.fetchDebtById,
      createDebt: state.createDebt,
      updateDebtDetails: state.updateDebtDetails,
      markDebtAsPaid: state.markDebtAsPaid,
      deleteDebt: state.deleteDebt,
      initializePayment: state.initializePayment,
      verifyPayment: state.verifyPayment,
      sendPaymentReminder: state.sendPaymentReminder,
      recordPayment: state.recordPayment,
      setLoading: state.setLoading,
      setError: state.setError,
      clearError: state.clearError,
      reset: state.reset,
    })),
  );

// Export search function for components that need it
export const useSearchDebts = () => useDebtStore((state) => state.searchDebts);

export default useDebtStore;
