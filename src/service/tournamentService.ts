import { HTTP_FUNCTION_URL } from "@constants/common";
import {
    Tournament,
    TournamentDetail,
    TournamentPlayer,
    TournamentTeam,
    TournamentMatch,
} from "@dts";
import { requestParticipant } from "./request";

const BASE = HTTP_FUNCTION_URL;

export const createTournament = async (data: {
    name: string;
    type: "singles" | "doubles";
    isOpen: boolean;
    userID: string;
    userName: string;
}): Promise<Tournament> => {
    const res = await requestParticipant<Tournament>("POST", `${BASE}?action=createTournament`, data);
    return res;
};

export const getTournaments = async (userID: string): Promise<Tournament[]> => {
    const res = await requestParticipant<Tournament[]>("GET", `${BASE}?action=getTournaments&userID=${encodeURIComponent(userID)}`);
    return res as Tournament[] || [];
};

export const getTournamentDetail = async (tournamentId: string): Promise<TournamentDetail> => {
    const res = await requestParticipant<TournamentDetail>("GET", `${BASE}?action=getTournament&tournamentId=${encodeURIComponent(tournamentId)}`);
    return res;
};

export const addPlayerToTournament = async (
    tournamentId: string,
    data: { userID: string; username: string; avatar: string; skillLevel: "A" | "B"; adminUserID: string },
): Promise<TournamentPlayer> => {
    const res = await requestParticipant<TournamentPlayer>(
        "POST",
        `${BASE}?action=addPlayer&tournamentId=${encodeURIComponent(tournamentId)}`,
        data,
    );
    return res;
};

export const removePlayerFromTournament = async (
    tournamentId: string,
    playerID: string,
    adminUserID: string,
): Promise<void> => {
    await requestParticipant<void>(
        "POST",
        `${BASE}?action=removePlayer&tournamentId=${encodeURIComponent(tournamentId)}&playerID=${encodeURIComponent(playerID)}`,
        { adminUserID },
    );
};

export const generateDraw = async (
    tournamentId: string,
    adminUserID: string,
): Promise<{ teams: TournamentTeam[]; matches: TournamentMatch[]; message: string }> => {
    const res = await requestParticipant<any>(
        "POST",
        `${BASE}?action=generateDraw&tournamentId=${encodeURIComponent(tournamentId)}`,
        { adminUserID },
    );
    return res;
};

export const updateMatchScore = async (
    tournamentId: string,
    matchId: string,
    score1: number,
    score2: number,
    userID: string,
): Promise<{ success: boolean; winnerId: string | null }> => {
    const res = await requestParticipant<any>(
        "POST",
        `${BASE}?action=updateScore&tournamentId=${encodeURIComponent(tournamentId)}&matchId=${encodeURIComponent(matchId)}`,
        { score1, score2, userID },
    );
    return res;
};

export const advanceToKnockout = async (
    tournamentId: string,
    adminUserID: string,
): Promise<any> => {
    const res = await requestParticipant<any>(
        "POST",
        `${BASE}?action=advanceToKnockout&tournamentId=${encodeURIComponent(tournamentId)}`,
        { adminUserID },
    );
    return res;
};

export const completeTournament = async (
    tournamentId: string,
    adminUserID: string,
): Promise<void> => {
    await requestParticipant<any>(
        "POST",
        `${BASE}?action=completeTournament&tournamentId=${encodeURIComponent(tournamentId)}`,
        { adminUserID },
    );
};
