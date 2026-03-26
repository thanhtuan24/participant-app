import React, { useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate, useParams } from "react-router-dom";

const MatchScorePage: React.FC = () => {
    const { id: tournamentId, matchId } = useParams<{ id: string; matchId: string }>();
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { updateScore, currentTournament } = useStore((s) => ({
        updateScore: s.updateScore,
        currentTournament: s.currentTournament,
    }));

    const match = currentTournament?.matches?.find((m) => m.id === matchId);
    const teams = currentTournament?.teams || [];
    const team1 = teams.find((t) => t.id === match?.team1Id);
    const team2 = teams.find((t) => t.id === match?.team2Id);

    const [score1, setScore1] = useState<string>(match?.score1?.toString() || "");
    const [score2, setScore2] = useState<string>(match?.score2?.toString() || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!tournamentId || !matchId || !user?.id) return;
        const s1 = parseInt(score1, 10);
        const s2 = parseInt(score2, 10);
        if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) return;
        if (s1 === s2) return; // No draws

        setSaving(true);
        try {
            await updateScore(tournamentId, matchId, s1, s2, user.id);
            navigate(`/tournaments/${tournamentId}`, { replace: true });
        } catch {
            // Error handled by store
        } finally {
            setSaving(false);
        }
    };

    const s1Num = parseInt(score1, 10);
    const s2Num = parseInt(score2, 10);
    const isValid = !Number.isNaN(s1Num) && !Number.isNaN(s2Num) && s1Num >= 0 && s2Num >= 0 && s1Num !== s2Num;

    if (!match) {
        return (
            <PageLayout title="Nhập điểm">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <p className="text-sm text-[#767A7F]">Không tìm thấy trận đấu</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Nhập điểm">
            <div className="bg-[#F4F5F6] min-h-screen">
                <div className="px-4 py-4 space-y-4">
                    {/* Match label */}
                    {match.matchLabel && (
                        <div className="text-center">
                            <span className="text-xs font-semibold text-[#046DD6] bg-[#EBF4FF] px-3 py-1 rounded-full">
                                {match.matchLabel}
                            </span>
                        </div>
                    )}

                    {/* Score input */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        {/* Team 1 */}
                        <div className="text-center mb-4">
                            <p className="text-sm font-bold text-[#141415] mb-3">{team1?.name || "Đội 1"}</p>
                            <input
                                type="number"
                                value={score1}
                                onChange={(e) => setScore1(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="30"
                                className="w-24 h-16 text-center text-3xl font-bold text-[#141415] bg-[#F4F5F6] rounded-xl border-2 border-gray-200 focus:border-[#046DD6] focus:outline-none"
                            />
                        </div>

                        {/* VS divider */}
                        <div className="flex items-center gap-3 my-3">
                            <div className="flex-1 border-t border-dashed border-gray-200" />
                            <span className="text-xs font-bold text-[#B9BDC1]">VS</span>
                            <div className="flex-1 border-t border-dashed border-gray-200" />
                        </div>

                        {/* Team 2 */}
                        <div className="text-center mt-4">
                            <p className="text-sm font-bold text-[#141415] mb-3">{team2?.name || "Đội 2"}</p>
                            <input
                                type="number"
                                value={score2}
                                onChange={(e) => setScore2(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="30"
                                className="w-24 h-16 text-center text-3xl font-bold text-[#141415] bg-[#F4F5F6] rounded-xl border-2 border-gray-200 focus:border-[#046DD6] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Validation */}
                    {score1 && score2 && s1Num === s2Num && (
                        <p className="text-xs text-red-500 text-center">Điểm số không được hòa</p>
                    )}

                    {/* Info */}
                    <div className="text-center text-xs text-[#B9BDC1]">
                        1 set — 21 điểm (max 30 nếu deuce)
                    </div>

                    {/* Save button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isValid || saving}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                            isValid && !saving
                                ? "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                : "bg-gray-200 text-gray-400"
                        }`}
                    >
                        {saving ? "Đang lưu..." : "Xác nhận điểm số"}
                    </button>

                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => navigate(`/tournaments/${tournamentId}`)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-[#767A7F] active:text-[#141415]"
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default MatchScorePage;
