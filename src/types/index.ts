import { FC } from "react";

export type ResData<T> = {
    data?: T;
    err: number;
    message: string;
};

export type ResHTTP<T> = {
    status: number;
    body?: T;
};

export type Address = {
    district: string;
    city: string;
};

export type User = {
    id: string;
    name: string;
    avatar: string;
    idByOA?: string;
};

export type OA = {
    oaId: string;
    follow: boolean;
    name: string;
    logoUrl?: string;
};

// eslint-disable-next-line no-shadow
export enum Status {
    INCOMPLETE,
    COMPLETED,
    OVERDUE,
}

export type ProfileNotification = {
    message: string;
    createdAt?: Date;
};

export type Profile = {
    name?: string;
    dueDate?: Date;
    profileCode?: string;
    notifications?: ProfileNotification[];
};

export type Organization = {
    officialAccounts?: OA[];
    id?: string;
    logoUrl?: string;
    description: string;
    name?: string;
};

export type Article = {
    author?: string;
    title?: string;
    desc?: string;
    link?: string;
    createdAt?: Date;
    thumb?: string;
    id?: string;
};

export type Articles = {
    total: number;
    articles: Article[];
    page: number;
    currentPageSize: number;
};

export type AppError = {
    message?: string;
    code?: number;
};

export type Feedback = {
    id: number;
    title: string;
    content: string;
    response: string;
    creationTime: Date;
    responseTime: Date;
    type: string;
    imageUrls?: string[];
};

export type InformationGuide = {
    id: number;
    question: string;
    answer: string;
};

export type FeedbackType = {
    id: number;
    title: string;
    order: number;
};

export type Feedbacks = {
    total: number;
    feedbacks: Feedback[];
    page: number;
    currentPageSize: number;
};

export type InformationGuides = {
    total: number;
    informationGuides: InformationGuide[];
    page: number;
    currentPageSize: number;
};

export type ScheduleAppointment = {
    fullName: string;
    number?: number;
    currentNumber?: number;
    date: Date;
    content: string;
    phoneNumber: string;
    status: ScheduleAppointmentStatus;
    rejectedInfo?: string;
};

export type PartiItem = {
    id: string;
    participantDate: string;
    userID: string;
    username: string;
    avatar: string;
    
    numberRegistered: number;
    status?: string;
    isMember: boolean;
    timestamp : number;
};

export type ScheduleAppointmentStatus = "pending" | "rejected" | "approved";

// ============================================================
// TOURNAMENT TYPES
// ============================================================

export type TournamentType = "singles" | "doubles";
export type TournamentStatus = "draft" | "group_stage" | "knockout" | "completed";
export type SkillLevel = "A" | "B";
export type MatchPhase = "group" | "semifinal" | "final" | "third_place";

export type Tournament = {
    id: string;
    name: string;
    type: TournamentType;
    isOpen: boolean;
    status: TournamentStatus;
    createdBy: string;
    createdByName: string;
    maxPoints: number;
    createdAt: number;
    updatedAt: number;
    playerCount?: number;
    teamCount?: number;
};

export type TournamentPlayer = {
    userID: string;
    username: string;
    avatar: string;
    skillLevel: SkillLevel;
};

export type TournamentTeam = {
    id: string;
    name: string;
    player1: TournamentPlayer;
    player2: TournamentPlayer | null;
};

export type TournamentMatch = {
    id: string;
    phase: MatchPhase;
    round: number;
    matchLabel?: string;
    team1Id: string | null;
    team2Id: string | null;
    score1: number | null;
    score2: number | null;
    winnerId: string | null;
    loserId?: string | null;
    status: "pending" | "completed";
    updatedBy: string | null;
    updatedAt: number | null;
};

export type TeamStanding = {
    teamId: string;
    teamName: string;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointsDiff: number;
    matchPoints: number;
};

export type TournamentDetail = Tournament & {
    players: TournamentPlayer[];
    teams: TournamentTeam[];
    matches: TournamentMatch[];
    standings: TeamStanding[];
};

export type Utility = {
    key: string;
    label: string;
    icon?: FC<any>;
    iconSrc?: string;
    path?: string;
    link?: string;
    inDevelopment?: boolean;
    phoneNumber?: string;
};

// ============================================================
// Challenge (Kèo) Types
// ============================================================
export type ChallengeType = "singles" | "doubles";
export type ChallengeMode = "manual" | "open";
export type ChallengeStatus = "open" | "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

export type ChallengePlayer = {
    userID: string;
    username: string;
    avatar: string;
};

export type ChallengeTeam = {
    players: ChallengePlayer[];
};

export type ChallengeSetScore = {
    set: number;
    score1: number;
    score2: number;
    updatedBy?: string;
    updatedAt?: number;
};

export type Challenge = {
    id: string;
    name: string;
    type: ChallengeType;
    mode: ChallengeMode;
    betStake: string;
    maxPoints: number;
    bestOf: number;
    playersPerTeam: number;
    scheduledAt: number | null;
    status: ChallengeStatus;
    createdBy: string;
    createdByName: string;
    team1: ChallengeTeam | null;
    team2: ChallengeTeam | null;
    scores: ChallengeSetScore[];
    winnerId: "team1" | "team2" | null;
    createdAt: number;
    updatedAt: number;
};
