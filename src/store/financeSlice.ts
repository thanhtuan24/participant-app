import { StateCreator } from "zustand";
import { 
    getFinanceSummary, 
    addTransaction, 
    FinanceSummary 
} from "@service/finance";
import { Transaction, TransactionType } from "@dts";

export interface FinanceSlice {
    loadingFinance: boolean;
    financeSummary: FinanceSummary;
    financeError: string | null;
    
    // Actions
    fetchFinanceSummary: (targetMonth?: string) => Promise<void>;
    recordTransaction: (
        amount: number,
        type: TransactionType,
        description: string,
        relatedUserID?: string,
        targetMonth?: string
    ) => Promise<boolean>;
}

const createFinanceSlice: StateCreator<FinanceSlice> = (set, get) => ({
    loadingFinance: false,
    financeSummary: { totalFund: 0, paidMembers: [] },
    financeError: null,

    fetchFinanceSummary: async (targetMonth?: string) => {
        try {
            set((state) => ({ ...state, loadingFinance: true, financeError: null }));
            const summary = await getFinanceSummary(targetMonth);
            set((state) => ({ 
                ...state, 
                loadingFinance: false, 
                financeSummary: summary 
            }));
        } catch (error) {
            console.error("Failed to fetch finance summary", error);
            set((state) => ({ 
                ...state, 
                loadingFinance: false, 
                financeError: "Failed to fetch finance data" 
            }));
        }
    },

    recordTransaction: async (
        amount: number,
        type: TransactionType,
        description: string,
        relatedUserID?: string,
        targetMonth?: string
    ) => {
        try {
            set((state) => ({ ...state, loadingFinance: true, financeError: null }));
            const result = await addTransaction(amount, type, description, relatedUserID, targetMonth);
            
            if (result) {
                // If successful, refresh the summary to reflect changes
                // If no targetMonth is passed to recordTransaction, use the one from the call or default
                // Ideally we should know the current context's month. 
                // For now, we'll just fetch without params (current month) or rely on caller to refresh.
                // But to be safe, let's refresh the summary with the same targetMonth if possible.
                // Since we don't store "currentViewedMonth" in this slice, we will let the UI trigger refresh or just fetch default.
                
                // Let's just fetch default (current month) for now, as that's the most common case.
                const newSummary = await getFinanceSummary(targetMonth);
                set((state) => ({ 
                    ...state, 
                    loadingFinance: false,
                    financeSummary: newSummary
                }));
                return true;
            } else {
                set((state) => ({ ...state, loadingFinance: false, financeError: "Failed to record transaction" }));
                return false;
            }
        } catch (error) {
            set((state) => ({ ...state, loadingFinance: false, financeError: "Error recording transaction" }));
            return false;
        }
    }
});

export default createFinanceSlice;
