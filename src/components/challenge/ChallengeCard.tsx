import React from "react";
import { useNavigate } from "react-router-dom";
import { Challenge } from "@dts";
import ChallengeStatusBadge from "./ChallengeStatusBadge";

interface Props {
    challenge: Challenge;
}

const ChallengeCard: React.FC<Props> = ({ challenge }) => {
    const navigate = useNavigate();

    const team1Name = challenge.team1?.players?.map((p) => p.username).join(" & ") || "???";
    const team2Name = challenge.team2?.players?.map((p) => p.username).join(" & ") || "Chờ đối thủ";

    const isOpen = challenge.mode === "open" && challenge.status === "open";
    const playersPerTeam = challenge.playersPerTeam || (challenge.type === "doubles" ? 2 : 1);
    const totalSlots = playersPerTeam * 2;
    const filledSlots = (challenge.team1?.players?.length || 0) + (challenge.team2?.players?.length || 0);

    const getScoreSummary = () => {
        if (!challenge.scores || challenge.scores.length === 0) return null;
        const t1Wins = challenge.scores.filter((s) => s.score1 > s.score2).length;
        const t2Wins = challenge.scores.filter((s) => s.score2 > s.score1).length;
        return `${t1Wins} - ${t2Wins}`;
    };

    const scoreSummary = getScoreSummary();

    return (
        <div
            role="button"
            tabIndex={0}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
            onClick={() => navigate(`/challenges/${challenge.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/challenges/${challenge.id}`); }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2.5">
                <div className="flex-1 mr-2">
                    <h3 className="text-base font-bold text-[#141415] line-clamp-1">{challenge.name}</h3>
                    {challenge.betStake && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">🎯 {challenge.betStake}</p>
                    )}
                </div>
                <ChallengeStatusBadge status={challenge.status} />
            </div>

            {/* Match info */}
            <div className="flex items-center gap-2 text-xs text-[#767A7F] mb-2.5">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                    challenge.type === "doubles" ? "bg-purple-50 text-purple-600" : "bg-sky-50 text-sky-600"
                }`}>
                    {challenge.type === "doubles" ? "Đôi" : "Đơn"}
                </span>
                <span>{challenge.maxPoints} điểm</span>
                <span>BO{challenge.bestOf}</span>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between bg-[#F4F5F6] rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-[#141415] truncate flex-1">{team1Name}</span>
                <span className="text-sm font-bold text-[#046DD6] mx-2">
                    {scoreSummary || "VS"}
                </span>
                <span className={`text-sm font-semibold truncate flex-1 text-right ${
                    challenge.team2 ? "text-[#141415]" : "text-[#B9BDC1] italic"
                }`}>
                    {team2Name}
                </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-2.5 text-[10px] text-[#B9BDC1]">
                <div className="flex items-center gap-2">
                    {challenge.scheduledAt && (
                        <span>📅 {new Date(challenge.scheduledAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}</span>
                    )}
                    {isOpen && (
                        <span className="text-teal-600 font-medium">
                            🙋 {filledSlots}/{totalSlots} người
                        </span>
                    )}
                </div>
                <span>Tạo bởi {challenge.createdByName || "?"}</span>
            </div>
        </div>
    );
};

export default ChallengeCard;
