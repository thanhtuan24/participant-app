import { HTTP_FUNCTION_URL } from "@constants/common";
import { requestParticipant } from "./request";

const BASE = HTTP_FUNCTION_URL;

export interface AdminConfig {
    mainTitle: string;
    enableRichFeatures: boolean;
    adminId: string | null;
}

export interface AdminConfigResponse {
    config: AdminConfig;
    isAdmin: boolean;
    noAdmin: boolean;
}

export interface MemberItem {
    userID: string;
    username: string;
    avatar: string;
    isMember: boolean;
}

export const getAdminConfig = async (userID: string): Promise<AdminConfigResponse> => {
    const res = await requestParticipant<AdminConfigResponse>(
        "GET",
        `${BASE}?action=getAdminConfig&userID=${encodeURIComponent(userID)}`,
    );
    return res;
};

export const updateConfig = async (data: {
    userID: string;
    mainTitle?: string;
    enableRichFeatures?: boolean;
}): Promise<{ config: AdminConfig; isAdmin: boolean }> => {
    const res = await requestParticipant<{ config: AdminConfig; isAdmin: boolean }>(
        "POST",
        `${BASE}?action=updateConfig`,
        data,
    );
    return res;
};

export const setAdmin = async (userID: string, newAdminId: string): Promise<void> => {
    await requestParticipant<{ success: boolean }>(
        "POST",
        `${BASE}?action=setAdmin`,
        { userID, newAdminId },
    );
};

export const getMembers = async (userID: string): Promise<MemberItem[]> => {
    const res = await requestParticipant<{ members: MemberItem[] }>(
        "GET",
        `${BASE}?action=getMembers&userID=${encodeURIComponent(userID)}`,
    );
    return res.members || [];
};

export const addMember = async (userID: string, targetUserID: string): Promise<void> => {
    await requestParticipant<{ success: boolean }>(
        "POST",
        `${BASE}?action=addMember`,
        { userID, targetUserID },
    );
};

export const removeMember = async (userID: string, targetUserID: string): Promise<void> => {
    await requestParticipant<{ success: boolean }>(
        "POST",
        `${BASE}?action=removeMember`,
        { userID, targetUserID },
    );
};
