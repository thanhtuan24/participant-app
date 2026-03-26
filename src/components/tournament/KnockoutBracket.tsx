import React from "react";
import { TournamentMatch, TournamentTeam } from "@dts";
import { getTeamById } from "@utils/tournamentHelper";
import MatchCard from "./MatchCard";

interface Props {
    matches: TournamentMatch[];
    teams: TournamentTeam[];
    isDoubles: boolean;
    onMatchClick?: (match: TournamentMatch) => void;
    canEdit?: boolean;
}

const KnockoutBracket: React.FC<Props> = ({ matches, teams, isDoubles, onMatchClick, canEdit }) => {
    const sf1 = matches.find((m) => m.id === "sf1");
    const sf2 = matches.find((m) => m.id === "sf2");
    const final = matches.find((m) => m.id === "final");
    const thirdPlace = matches.find((m) => m.id === "third_place");

    if (!sf1 && !sf2 && !final && !thirdPlace) {
        return (
            <div className="text-center py-8 text-sm text-[#767A7F]">
                Chưa có vòng knockout
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Semifinals */}
            <div>
                <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide mb-2 px-1">
                    Bán kết
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {sf1 && (
                        <MatchCard
                            match={{ ...sf1, matchLabel: "Bán kết 1" }}
                            teams={teams}
                            isDoubles={isDoubles}
                            onClick={() => onMatchClick?.(sf1)}
                            canEdit={canEdit && sf1.status !== "completed"}
                        />
                    )}
                    {sf2 && (
                        <MatchCard
                            match={{ ...sf2, matchLabel: "Bán kết 2" }}
                            teams={teams}
                            isDoubles={isDoubles}
                            onClick={() => onMatchClick?.(sf2)}
                            canEdit={canEdit && sf2.status !== "completed"}
                        />
                    )}
                </div>
            </div>

            {/* Final */}
            {final && (
                <div>
                    <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide mb-2 px-1">
                        🏆 Chung kết
                    </h4>
                    <MatchCard
                        match={{ ...final, matchLabel: "Chung kết" }}
                        teams={teams}
                        isDoubles={isDoubles}
                        onClick={() => onMatchClick?.(final)}
                        canEdit={canEdit && final.status !== "completed"}
                    />
                </div>
            )}

            {/* Third place */}
            {thirdPlace && (
                <div>
                    <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide mb-2 px-1">
                        🥉 Tranh giải 3-4
                    </h4>
                    <MatchCard
                        match={{ ...thirdPlace, matchLabel: "Tranh giải 3-4" }}
                        teams={teams}
                        isDoubles={isDoubles}
                        onClick={() => onMatchClick?.(thirdPlace)}
                        canEdit={canEdit && thirdPlace.status !== "completed"}
                    />
                </div>
            )}

            {/* Winner announcement */}
            {final?.status === "completed" && final.winnerId && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-4 text-center">
                    <div className="text-2xl mb-1">🏆</div>
                    <p className="text-xs text-amber-600 font-medium">Vô địch</p>
                    <p className="text-base font-bold text-amber-800">
                        {getTeamById(teams, final.winnerId)?.name || ""}
                    </p>
                </div>
            )}
        </div>
    );
};

export default KnockoutBracket;
