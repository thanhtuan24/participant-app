import React from "react";
import { TournamentMatch, TournamentTeam } from "@dts";
import { getTeamById } from "@utils/tournamentHelper";
import TeamDisplay from "./TeamDisplay";

interface Props {
    match: TournamentMatch;
    teams: TournamentTeam[];
    isDoubles: boolean;
    onClick?: () => void;
    canEdit?: boolean;
}

const MatchCard: React.FC<Props> = ({ match, teams, isDoubles, onClick, canEdit }) => {
    const team1 = getTeamById(teams, match.team1Id);
    const team2 = getTeamById(teams, match.team2Id);
    const isCompleted = match.status === "completed";

    const getPhaseClass = (phase?: string) => {
        if (phase === "final") return "bg-amber-50 text-amber-700";
        if (phase === "third_place") return "bg-orange-50 text-orange-600";
        if (phase === "semifinal") return "bg-blue-50 text-blue-600";
        return "bg-gray-50 text-gray-500";
    };

    const getStatusLabel = () => {
        if (isCompleted) return "✓ Hoàn tất";
        if (canEdit) return "Nhấn để nhập điểm";
        return "Chờ thi đấu";
    };

    const cardContent = (
        <>
            {/* Match header */}
            {match.matchLabel && (
                <div className={`px-3 py-1.5 text-xs font-semibold text-center ${getPhaseClass(match.phase)}`}>
                    {match.matchLabel}
                </div>
            )}

            <div className="px-3 py-2.5">
                {/* Team 1 */}
                <div className={`flex items-center justify-between py-1.5 ${
                    isCompleted && match.winnerId === match.team1Id ? "font-bold" : ""
                }`}>
                    <div className="flex-1 min-w-0">
                        {team1 ? (
                            <TeamDisplay team={team1} isDoubles={isDoubles} />
                        ) : (
                            <span className="text-sm text-gray-400 italic">Chờ xác định</span>
                        )}
                    </div>
                    <span className={`text-lg font-bold min-w-[32px] text-center ${
                        isCompleted && match.winnerId === match.team1Id ? "text-green-600" : "text-[#141415]"
                    }`}>
                        {match.score1 !== null ? match.score1 : "-"}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-100 my-0.5" />

                {/* Team 2 */}
                <div className={`flex items-center justify-between py-1.5 ${
                    isCompleted && match.winnerId === match.team2Id ? "font-bold" : ""
                }`}>
                    <div className="flex-1 min-w-0">
                        {team2 ? (
                            <TeamDisplay team={team2} isDoubles={isDoubles} />
                        ) : (
                            <span className="text-sm text-gray-400 italic">Chờ xác định</span>
                        )}
                    </div>
                    <span className={`text-lg font-bold min-w-[32px] text-center ${
                        isCompleted && match.winnerId === match.team2Id ? "text-green-600" : "text-[#141415]"
                    }`}>
                        {match.score2 !== null ? match.score2 : "-"}
                    </span>
                </div>
            </div>

            {/* Status bar */}
            <div className={`px-3 py-1 text-[10px] text-center ${
                isCompleted ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
            }`}>
                {getStatusLabel()}
            </div>
        </>
    );

    const baseClass = `bg-white rounded-xl border overflow-hidden ${isCompleted ? "border-green-100" : "border-gray-100"}`;

    if (canEdit) {
        return (
            <div
                role="button"
                tabIndex={0}
                className={`${baseClass} active:bg-gray-50 cursor-pointer`}
                onClick={onClick}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <div className={baseClass}>
            {cardContent}
        </div>
    );
};

export default MatchCard;
