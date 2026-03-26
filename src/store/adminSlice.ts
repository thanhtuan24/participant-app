import { StateCreator } from "zustand";
import {
    AdminConfig,
    MemberItem,
    getAdminConfig as apiGetConfig,
    updateConfig as apiUpdateConfig,
    setAdmin as apiSetAdmin,
    getMembers as apiGetMembers,
    addMember as apiAddMember,
    removeMember as apiRemoveMember,
} from "@service/adminService";

export interface AdminSlice {
    adminConfig: AdminConfig | null;
    isAdmin: boolean;
    noAdmin: boolean;
    members: MemberItem[];
    loadingAdminConfig: boolean;
    loadingMembers: boolean;
    adminError: string | null;

    fetchAdminConfig: (userID: string) => Promise<void>;
    updateAdminConfig: (data: {
        userID: string;
        mainTitle?: string;
        enableRichFeatures?: boolean;
    }) => Promise<void>;
    setNewAdmin: (userID: string, newAdminId: string) => Promise<void>;
    fetchMembers: (userID: string) => Promise<void>;
    addMemberAction: (userID: string, targetUserID: string) => Promise<void>;
    removeMemberAction: (userID: string, targetUserID: string) => Promise<void>;
    clearAdminError: () => void;
}

const adminSlice: StateCreator<AdminSlice> = (set, get) => ({
    adminConfig: null,
    isAdmin: false,
    noAdmin: false,
    members: [],
    loadingAdminConfig: false,
    loadingMembers: false,
    adminError: null,

    fetchAdminConfig: async (userID: string) => {
        set({ loadingAdminConfig: true, adminError: null });
        try {
            const res = await apiGetConfig(userID);
            set({
                adminConfig: res.config,
                isAdmin: res.isAdmin,
                noAdmin: res.noAdmin,
                loadingAdminConfig: false,
            });
        } catch (error: any) {
            set({ loadingAdminConfig: false, adminError: error.message });
        }
    },

    updateAdminConfig: async (data) => {
        set({ adminError: null });
        try {
            const res = await apiUpdateConfig(data);
            set({ adminConfig: res.config, isAdmin: res.isAdmin, noAdmin: false });
        } catch (error: any) {
            set({ adminError: error.message });
            throw error;
        }
    },

    setNewAdmin: async (userID, newAdminId) => {
        set({ adminError: null });
        try {
            await apiSetAdmin(userID, newAdminId);
            // Refresh config
            await get().fetchAdminConfig(userID);
        } catch (error: any) {
            set({ adminError: error.message });
            throw error;
        }
    },

    fetchMembers: async (userID: string) => {
        set({ loadingMembers: true, adminError: null });
        try {
            const members = await apiGetMembers(userID);
            set({ members, loadingMembers: false });
        } catch (error: any) {
            set({ loadingMembers: false, adminError: error.message });
        }
    },

    addMemberAction: async (userID, targetUserID) => {
        set({ adminError: null });
        try {
            await apiAddMember(userID, targetUserID);
            await get().fetchMembers(userID);
        } catch (error: any) {
            set({ adminError: error.message });
            throw error;
        }
    },

    removeMemberAction: async (userID, targetUserID) => {
        set({ adminError: null });
        try {
            await apiRemoveMember(userID, targetUserID);
            await get().fetchMembers(userID);
        } catch (error: any) {
            set({ adminError: error.message });
            throw error;
        }
    },

    clearAdminError: () => set({ adminError: null }),
});

export default adminSlice;
