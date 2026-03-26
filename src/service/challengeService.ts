import { HTTP_FUNCTION_URL } from "@constants/common";
import { Challenge, ChallengeMode } from "@dts";
import { requestParticipant } from "./request";

const BASE = HTTP_FUNCTION_URL;

export const createChallenge = async (data: {
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
}): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>("POST", `${BASE}?action=createChallenge`, data);
    return res;
};

export const getChallenges = async (userID: string): Promise<Challenge[]> => {
    const res = await requestParticipant<Challenge[]>(
        "GET",
        `${BASE}?action=getChallenges&userID=${encodeURIComponent(userID)}`,
    );
    return (res as Challenge[]) || [];
};

export const getChallengeDetail = async (challengeId: string): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>(
        "GET",
        `${BASE}?action=getChallenge&challengeId=${encodeURIComponent(challengeId)}`,
    );
    return res;
};

export const acceptChallenge = async (
    challengeId: string,
    data: { userID: string; userName: string; userAvatar: string },
): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>(
        "POST",
        `${BASE}?action=acceptChallenge`,
        { challengeId, ...data },
    );
    return res;
};

export const joinChallenge = async (
    challengeId: string,
    data: { userID: string; userName: string; userAvatar: string; team: "team1" | "team2" },
): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>(
        "POST",
        `${BASE}?action=joinChallenge`,
        { challengeId, ...data },
    );
    return res;
};

export const updateChallengeScore = async (
    challengeId: string,
    setNumber: number,
    score1: number,
    score2: number,
    userID: string,
): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>(
        "POST",
        `${BASE}?action=updateChallengeScore`,
        { challengeId, setNumber, score1, score2, userID },
    );
    return res;
};

export const completeChallenge = async (
    challengeId: string,
    userID: string,
): Promise<Challenge> => {
    const res = await requestParticipant<Challenge>(
        "POST",
        `${BASE}?action=completeChallenge`,
        { challengeId, userID },
    );
    return res;
};
