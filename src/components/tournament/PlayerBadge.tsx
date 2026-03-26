import React from "react";
import { TournamentPlayer } from "@dts";

interface Props {
    player: TournamentPlayer;
    onRemove?: () => void;
    showRemove?: boolean;
}

const PlayerBadge: React.FC<Props> = ({ player, onRemove, showRemove }) => (
        <div className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <div className="relative">
                {player.avatar ? (
                    <img
                        src={player.avatar}
                        alt={player.username}
                        className="w-9 h-9 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {player.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                    player.skillLevel === "A" ? "bg-red-500" : "bg-blue-500"
                }`}>
                    {player.skillLevel}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#141415] truncate">{player.username}</p>
                <p className="text-xs text-[#B9BDC1]">
                    Trình độ {player.skillLevel === "A" ? "Cao" : "Trung bình"}
                </p>
            </div>

            {showRemove && onRemove && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="text-red-400 hover:text-red-600 text-lg px-1"
                >
                    ✕
                </button>
            )}
        </div>
    );

export default PlayerBadge;
