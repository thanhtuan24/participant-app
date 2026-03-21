import { request } from "./request";
import { HTTP_FUNCTION_URL } from "@constants/common";
import { Transaction, TransactionType } from "@dts";

export type FinanceSummary = {
    totalFund: number;
    paidMembers: string[];
};

export const getFinanceSummary = async (targetMonth?: string): Promise<FinanceSummary> => {
    try {
        const payload = {
            action: "FINANCE",
            subAction: "GET_SUMMARY",
            targetMonth
        };
        
        // POST to the single endpoint
        const response = await request<FinanceSummary>("POST", HTTP_FUNCTION_URL, payload);
        return response;
    } catch (error) {
        console.error("Error fetching finance summary:", error);
        return { totalFund: 0, paidMembers: [] };
    }
};

export const addTransaction = async (
    amount: number,
    type: TransactionType,
    description: string,
    relatedUserID?: string,
    targetMonth?: string
): Promise<Transaction | null> => {
    try {
        const payload = {
            action: "FINANCE",
            subAction: "ADD_TRANSACTION",
            amount,
            type,
            description,
            relatedUserID,
            targetMonth
        };
        
        const response = await request<Transaction>("POST", HTTP_FUNCTION_URL, payload);
        return response;
    } catch (error) {
        console.error("Error adding transaction:", error);
        return null;
    }
};
