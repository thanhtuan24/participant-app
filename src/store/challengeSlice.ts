import { Challenge, ChallengeMode } from "@dts";
import {
    createChallenge as apiCreate,
    getChallenges as apiGetList,
    getChallengeDetail as apiGetDetail,
    acceptChallenge as apiAccept,
    joinChallenge as apiJoin,
    updateChallengeScore as apiUpdateScore,
    completeChallenge as apiComplete,
    updateChallenge as apiUpdate,
} from "@service/challengeService";
import { StateCreator } from "zustand";

export interface ChallengeSlice {
    challenges: Challenge[];
    currentChallenge: Challenge | null;
    loadingChallenges: boolean;
    loadingChallengeDetail: boolean;
    creatingChallenge: boolean;
    challengeError: string | null;

    fetchChallenges: (userID: string) => Promise<void>;
    fetchChallengeDetail: (challengeId: string) => Promise<void>;
    createNewChallenge: (data: {
        name: string;
        type: "singles" | "doubles";
        mode: ChallengeMode;
        betStake: string;
        maxPoints: number;
        bestOf: number;
        scheduledAt: number | null;
        userID: string;
        userName: string;
        userAvatar: string;
        team1Players?: { userID: string; username: string; avatar: string }[];
        team2Players?: { userID: string; username: string; avatar: string }[];
    }) => Promise<string>;
    acceptChallengeAction: (
        challengeId: string,
        data: { userID: string; userName: string; userAvatar: string },
    ) => Promise<void>;
    joinChallengeAction: (
        challengeId: string,
        data: { userID: string; userName: string; userAvatar: string; team: "team1" | "team2" },
    ) => Promise<void>;
    updateChallengeScoreAction: (
        challengeId: string,
        setNumber: number,
        score1: number,
        score2: number,
        userID: string,
    ) => Promise<void>;
    completeChallengeAction: (challengeId: string, userID: string) => Promise<void>;
    updateChallengeAction: (
        challengeId: string,
        userID: string,
        data: {
            name?: string;
            betStake?: string;
            scheduledAt?: number | null;
            scores?: { set: number; score1: number; score2: number }[];
        },
    ) => Promise<void>;
    clearChallengeError: () => void;
}

const challengeSlice: StateCreator<ChallengeSlice> = (set, get) => ({
    challenges: [],
    currentChallenge: null,
    loadingChallenges: false,
    loadingChallengeDetail: false,
    creatingChallenge: false,
    challengeError: null,

    fetchChallenges: async (userID: string) => {
        set({ loadingChallenges: true, challengeError: null });
        try {
            const list = await apiGetList(userID);
            set({ challenges: Array.isArray(list) ? list : [], loadingChallenges: false });
        } catch (error: any) {
            set({ loadingChallenges: false, challengeError: error.message });
        }
    },

    fetchChallengeDetail: async (challengeId: string) => {
        set({ loadingChallengeDetail: true, challengeError: null });
        try {
            const detail = await apiGetDetail(challengeId);
            set({ currentChallenge: detail, loadingChallengeDetail: false });
        } catch (error: any) {
            set({ loadingChallengeDetail: false, challengeError: error.message });
        }
    },

    createNewChallenge: async (data) => {
        set({ creatingChallenge: true, challengeError: null });
        try {
            const result = await apiCreate(data);
            set({ creatingChallenge: false });
            return result.id;
        } catch (error: any) {
            set({ creatingChallenge: false, challengeError: error.message });
            throw error;
        }
    },

    acceptChallengeAction: async (challengeId, data) => {
        try {
            await apiAccept(challengeId, data);
            await get().fetchChallengeDetail(challengeId);
        } catch (error: any) {
            set({ challengeError: error.message });
            throw error;
        }
    },

    joinChallengeAction: async (challengeId, data) => {
        try {
            await apiJoin(challengeId, data);
            await get().fetchChallengeDetail(challengeId);
        } catch (error: any) {
            set({ challengeError: error.message });
            throw error;
        }
    },

    updateChallengeScoreAction: async (challengeId, setNumber, score1, score2, userID) => {
        try {
            await apiUpdateScore(challengeId, setNumber, score1, score2, userID);
            await get().fetchChallengeDetail(challengeId);
        } catch (error: any) {
            set({ challengeError: error.message });
            throw error;
        }
    },

    completeChallengeAction: async (challengeId, userID) => {
        try {
            await apiComplete(challengeId, userID);
            await get().fetchChallengeDetail(challengeId);
        } catch (error: any) {
            set({ challengeError: error.message });
            throw error;
        }
    },

    updateChallengeAction: async (challengeId, userID, data) => {
        try {
            await apiUpdate(challengeId, userID, data);
            await get().fetchChallengeDetail(challengeId);
        } catch (error: any) {
            set({ challengeError: error.message });
            throw error;
        }
    },

    clearChallengeError: () => set({ challengeError: null }),
});

export default challengeSlice;
