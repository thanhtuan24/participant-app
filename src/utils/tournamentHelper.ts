import { TeamStanding, TournamentMatch, TournamentTeam } from "@dts";

/**
 * Sort standings: matchPoints DESC → pointsDiff DESC → pointsFor DESC
 */
export function sortStandings(standings: TeamStanding[]): TeamStanding[] {
    return [...standings].sort((a, b) =>
        (b.matchPoints - a.matchPoints) ||
        (b.pointsDiff - a.pointsDiff) ||
        (b.pointsFor - a.pointsFor),
    );
}

/**
 * Get team by ID from teams array
 */
export function getTeamById(teams: TournamentTeam[], teamId: string | null): TournamentTeam | undefined {
    if (!teamId) return undefined;
    return teams.find((t) => t.id === teamId);
}

/**
 * Get matches for a specific phase
 */
export function getMatchesByPhase(matches: TournamentMatch[], phase: string): TournamentMatch[] {
    return matches.filter((m) => m.phase === phase);
}

/**
 * Get group matches organized by round
 */
export function getGroupMatchesByRound(matches: TournamentMatch[]): Record<number, TournamentMatch[]> {
    const groupMatches = getMatchesByPhase(matches, "group");
    const byRound: Record<number, TournamentMatch[]> = {};
    groupMatches.forEach((m) => {
        const round = m.round || 1;
        if (!byRound[round]) byRound[round] = [];
        byRound[round].push(m);
    });
    return byRound;
}

/**
 * Check if all group matches are completed
 */
export function areAllGroupMatchesDone(matches: TournamentMatch[]): boolean {
    const groupMatches = getMatchesByPhase(matches, "group");
    return groupMatches.length > 0 && groupMatches.every((m) => m.status === "completed");
}

/**
 * Check if all knockout matches are completed
 */
export function areAllKnockoutMatchesDone(matches: TournamentMatch[]): boolean {
    const knockoutMatches = matches.filter((m) => m.phase !== "group");
    return knockoutMatches.length > 0 && knockoutMatches.every((m) => m.status === "completed");
}

/**
 * Get tournament status display text
 */
export function getTournamentStatusText(status: string): string {
    switch (status) {
        case "draft": return "Chuẩn bị";
        case "group_stage": return "Vòng bảng";
        case "knockout": return "Vòng knockout";
        case "completed": return "Hoàn tất";
        default: return status;
    }
}

/**
 * Get tournament status color classes
 */
export function getTournamentStatusColor(status: string): string {
    switch (status) {
        case "draft": return "bg-gray-100 text-gray-600";
        case "group_stage": return "bg-blue-100 text-blue-700";
        case "knockout": return "bg-orange-100 text-orange-700";
        case "completed": return "bg-green-100 text-green-700";
        default: return "bg-gray-100 text-gray-600";
    }
}
