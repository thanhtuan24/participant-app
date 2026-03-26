import React from "react";
import { TournamentTeam } from "@dts";

interface Props {
    team: TournamentTeam;
    isDoubles: boolean;
}

const TeamDisplay: React.FC<Props> = ({ team, isDoubles }) => (
        <div className="flex items-center gap-2">
            {/* Player 1 avatar */}
            <div className="flex -space-x-2">
                {team.player1?.avatar ? (
                    <img src={team.player1.avatar} className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
                ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {team.player1?.username?.charAt(0) || "?"}
                    </div>
                )}
                {isDoubles && team.player2 && (
                    team.player2.avatar ? (
                        <img src={team.player2.avatar} className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
                    ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {team.player2.username?.charAt(0) || "?"}
                        </div>
                    )
                )}
            </div>
            <span className="text-sm font-medium text-[#141415] truncate">{team.name}</span>
        </div>
    );

export default TeamDisplay;
