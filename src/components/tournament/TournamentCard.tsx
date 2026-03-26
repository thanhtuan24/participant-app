import React from "react";
import { useNavigate } from "react-router-dom";
import { Tournament } from "@dts";
import TournamentStatusBadge from "./TournamentStatusBadge";

interface Props {
    tournament: Tournament;
}

const TournamentCard: React.FC<Props> = ({ tournament }) => {
    const navigate = useNavigate();

    return (
        <div
            role="button"
            tabIndex={0}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/tournaments/${tournament.id}`); }}
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-bold text-[#141415] flex-1 mr-2 line-clamp-1">
                    {tournament.name}
                </h3>
                <TournamentStatusBadge status={tournament.status} />
            </div>

            <div className="flex items-center gap-3 text-xs text-[#767A7F]">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                    tournament.type === "doubles"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-sky-50 text-sky-600"
                }`}>
                    {tournament.type === "doubles" ? "🏸 Đôi" : "🏸 Đơn"}
                </span>

                {tournament.isOpen && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                        🌐 Mở rộng
                    </span>
                )}

                {tournament.playerCount !== undefined && (
                    <span>{tournament.playerCount} người chơi</span>
                )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <span className="text-xs text-[#B9BDC1]">
                    Tạo bởi {tournament.createdByName || "Admin"}
                </span>
                {tournament.createdAt && (
                    <span className="text-xs text-[#B9BDC1]">
                        {new Date(tournament.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TournamentCard;
