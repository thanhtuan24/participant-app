import { Tournament, TournamentDetail } from "@dts";
import {
    createTournament as apiCreate,
    getTournaments as apiGetList,
    getTournamentDetail as apiGetDetail,
    addPlayerToTournament as apiAddPlayer,
    removePlayerFromTournament as apiRemovePlayer,
    generateDraw as apiGenerateDraw,
    updateMatchScore as apiUpdateScore,
    advanceToKnockout as apiAdvance,
    completeTournament as apiComplete,
} from "@service/tournamentService";
import { StateCreator } from "zustand";

export interface TournamentSlice {
    tournaments: Tournament[];
    currentTournament: TournamentDetail | null;
    loadingTournaments: boolean;
    loadingTournamentDetail: boolean;
    creatingTournament: boolean;
    tournamentError: string | null;

    fetchTournaments: (userID: string) => Promise<void>;
    fetchTournamentDetail: (tournamentId: string) => Promise<void>;
    createNewTournament: (data: {
        name: string;
        type: "singles" | "doubles";
        isOpen: boolean;
        userID: string;
        userName: string;
    }) => Promise<string>;
    addPlayer: (
        tournamentId: string,
        data: { userID: string; username: string; avatar: string; skillLevel: "A" | "B"; adminUserID: string },
    ) => Promise<void>;
    removePlayer: (tournamentId: string, playerID: string, adminUserID: string) => Promise<void>;
    generateDraw: (tournamentId: string, adminUserID: string) => Promise<void>;
    updateScore: (tournamentId: string, matchId: string, score1: number, score2: number, userID: string) => Promise<void>;
    advanceToKnockout: (tournamentId: string, adminUserID: string) => Promise<void>;
    completeTournament: (tournamentId: string, adminUserID: string) => Promise<void>;
    clearTournamentError: () => void;
}

const tournamentSlice: StateCreator<TournamentSlice> = (set, get) => ({
    tournaments: [],
    currentTournament: null,
    loadingTournaments: false,
    loadingTournamentDetail: false,
    creatingTournament: false,
    tournamentError: null,

    fetchTournaments: async (userID: string) => {
        set({ loadingTournaments: true, tournamentError: null });
        try {
            const list = await apiGetList(userID);
            set({ tournaments: Array.isArray(list) ? list : [], loadingTournaments: false });
        } catch (error: any) {
            set({ loadingTournaments: false, tournamentError: error.message });
        }
    },

    fetchTournamentDetail: async (tournamentId: string) => {
        set({ loadingTournamentDetail: true, tournamentError: null });
        try {
            const detail = await apiGetDetail(tournamentId);
            set({ currentTournament: detail, loadingTournamentDetail: false });
        } catch (error: any) {
            set({ loadingTournamentDetail: false, tournamentError: error.message });
        }
    },

    createNewTournament: async (data) => {
        set({ creatingTournament: true, tournamentError: null });
        try {
            const result = await apiCreate(data);
            set({ creatingTournament: false });
            return result.id;
        } catch (error: any) {
            set({ creatingTournament: false, tournamentError: error.message });
            throw error;
        }
    },

    addPlayer: async (tournamentId, data) => {
        try {
            await apiAddPlayer(tournamentId, data);
            // Refresh detail
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    removePlayer: async (tournamentId, playerID, adminUserID) => {
        try {
            await apiRemovePlayer(tournamentId, playerID, adminUserID);
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    generateDraw: async (tournamentId, adminUserID) => {
        try {
            await apiGenerateDraw(tournamentId, adminUserID);
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    updateScore: async (tournamentId, matchId, score1, score2, userID) => {
        try {
            await apiUpdateScore(tournamentId, matchId, score1, score2, userID);
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    advanceToKnockout: async (tournamentId, adminUserID) => {
        try {
            await apiAdvance(tournamentId, adminUserID);
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    completeTournament: async (tournamentId, adminUserID) => {
        try {
            await apiComplete(tournamentId, adminUserID);
            await get().fetchTournamentDetail(tournamentId);
        } catch (error: any) {
            set({ tournamentError: error.message });
            throw error;
        }
    },

    clearTournamentError: () => {
        set({ tournamentError: null });
    },
});

export default tournamentSlice;
