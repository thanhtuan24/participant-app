import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useParams } from "react-router-dom";
import { ChallengeStatusBadge } from "@components/challenge";
import { ChallengeSetScore } from "@dts";

const ChallengeDetailPage: React.FC = () => {
    const { id: challengeId } = useParams<{ id: string }>();
    const user = useStore((s) => s.user);
    const {
        currentChallenge,
        loadingChallengeDetail,
        challengeError,
        fetchChallengeDetail,
        acceptChallengeAction,
        joinChallengeAction,
        updateChallengeScoreAction,
        completeChallengeAction,
        clearChallengeError,
    } = useStore((s) => ({
        currentChallenge: s.currentChallenge,
        loadingChallengeDetail: s.loadingChallengeDetail,
        challengeError: s.challengeError,
        fetchChallengeDetail: s.fetchChallengeDetail,
        acceptChallengeAction: s.acceptChallengeAction,
        joinChallengeAction: s.joinChallengeAction,
        updateChallengeScoreAction: s.updateChallengeScoreAction,
        completeChallengeAction: s.completeChallengeAction,
        clearChallengeError: s.clearChallengeError,
    }));

    const [actionLoading, setActionLoading] = useState(false);
    const [editingSet, setEditingSet] = useState<number | null>(null);
    const [editScore1, setEditScore1] = useState(0);
    const [editScore2, setEditScore2] = useState(0);

    useEffect(() => {
        if (challengeId) {
            fetchChallengeDetail(challengeId);
        }
        return () => clearChallengeError();
    }, [challengeId]);

    if (loadingChallengeDetail || !currentChallenge) {
        return (
            <PageLayout title="Chi tiết kèo">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                        Đang tải...
                    </span>
                </div>
            </PageLayout>
        );
    }

    const c = currentChallenge;
    const isCreator = user?.id === c.createdBy;
    const team1Name = c.team1?.players?.map((p) => p.username).join(" & ") || "???";
    const team2Name = c.team2?.players?.map((p) => p.username).join(" & ") || "Chờ đối thủ";

    const isOpenMode = c.mode === "open";
    const playersPerTeam = c.playersPerTeam || (c.type === "doubles" ? 2 : 1);
    const t1Players = c.team1?.players || [];
    const t2Players = c.team2?.players || [];
    const t1Full = t1Players.length >= playersPerTeam;
    const t2Full = t2Players.length >= playersPerTeam;
    const alreadyJoined = [...t1Players, ...t2Players].some((p) => p.userID === user?.id);

    const canJoin = isOpenMode && c.status === "open" && !!user?.id && !alreadyJoined;
    const canAccept = c.status === "pending" && !isCreator && user?.id;

    // Creator or any logged-in user can edit scores
    const canEditScores =
        (c.status === "accepted" || c.status === "in_progress") && !!user?.id;

    const canComplete =
        (c.status === "accepted" || c.status === "in_progress") &&
        !!user?.id &&
        c.scores &&
        c.scores.length > 0;

    const handleAccept = async () => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await acceptChallengeAction(challengeId, {
                userID: user.id,
                userName: user.name || "",
                userAvatar: user.avatar || "",
            });
        } catch {
            /* error shown via challengeError */
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = async (team: "team1" | "team2") => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await joinChallengeAction(challengeId, {
                userID: user.id,
                userName: user.name || "",
                userAvatar: user.avatar || "",
                team,
            });
        } catch {
            /* error shown via challengeError */
        } finally {
            setActionLoading(false);
        }
    };

    const startEditSet = (setNum: number) => {
        const existing = c.scores?.find((s) => s.set === setNum);
        setEditScore1(existing?.score1 ?? 0);
        setEditScore2(existing?.score2 ?? 0);
        setEditingSet(setNum);
    };

    const handleSaveScore = async () => {
        if (editingSet === null || !challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await updateChallengeScoreAction(
                challengeId,
                editingSet,
                editScore1,
                editScore2,
                user.id,
            );
            setEditingSet(null);
        } catch {
            /* error shown via challengeError */
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await completeChallengeAction(challengeId, user.id);
        } catch {
            /* error shown via challengeError */
        } finally {
            setActionLoading(false);
        }
    };

    const getSetWinner = (s: ChallengeSetScore): string | null => {
        if (s.score1 > s.score2) return "team1";
        if (s.score2 > s.score1) return "team2";
        return null;
    };

    const t1SetWins = (c.scores || []).filter((s) => getSetWinner(s) === "team1").length;
    const t2SetWins = (c.scores || []).filter((s) => getSetWinner(s) === "team2").length;

    const setsToWin = Math.ceil(c.bestOf / 2);

    return (
        <PageLayout title="Chi tiết kèo">
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                        <h2 className="text-base font-bold text-[#141415] flex-1 mr-2">{c.name}</h2>
                        <ChallengeStatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs text-[#767A7F]">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                            c.type === "doubles" ? "bg-purple-50 text-purple-600" : "bg-sky-50 text-sky-600"
                        }`}>
                            {c.type === "doubles" ? "Đôi" : "Đơn"}
                        </span>
                        <span>{c.maxPoints} điểm/set</span>
                        <span>BO{c.bestOf}</span>
                        {c.betStake && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                                🎯 {c.betStake}
                            </span>
                        )}
                    </div>
                    {c.scheduledAt && (
                        <p className="text-xs text-[#767A7F] mt-2">
                            📅 {new Date(c.scheduledAt).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    )}
                </div>

                {/* Scoreboard */}
                <div className="mx-4 mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Team names + overall score */}
                    <div className="flex items-center px-4 py-3">
                        <div className="flex-1 text-center">
                            <p className="text-sm font-bold text-[#141415] truncate">{team1Name}</p>
                            {isCreator && <p className="text-[10px] text-amber-500">👑 Tạo kèo</p>}
                            {isOpenMode && (
                                <p className="text-[10px] text-[#767A7F]">
                                    {t1Players.length}/{playersPerTeam} người
                                </p>
                            )}
                        </div>
                        <div className="px-4 text-center">
                            <div className="text-2xl font-black text-[#046DD6]">
                                {t1SetWins} - {t2SetWins}
                            </div>
                            <p className="text-[10px] text-[#B9BDC1] mt-0.5">Thắng {setsToWin} set</p>
                        </div>
                        <div className="flex-1 text-center">
                            <p className={`text-sm font-bold truncate ${c.team2 ? "text-[#141415]" : "text-[#B9BDC1] italic"}`}>
                                {team2Name}
                            </p>
                            {isOpenMode && (
                                <p className="text-[10px] text-[#767A7F]">
                                    {t2Players.length}/{playersPerTeam} người
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Open mode: player slots */}
                    {isOpenMode && c.status === "open" && (
                        <div className="border-t border-gray-100 px-4 py-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Team 1 slots */}
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-[#046DD6]">Đội 1</p>
                                    {t1Players.map((p) => (
                                        <div key={p.userID} className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2 py-1.5">
                                            <span className="text-xs">🏸</span>
                                            <span className="text-xs font-medium text-[#141415] truncate">{p.username}</span>
                                        </div>
                                    ))}
                                    {Array.from({ length: playersPerTeam - t1Players.length }).map((_, idx) => (
                                        <div key={`empty-t1-slot-${playersPerTeam - idx}`} className="flex items-center justify-center border border-dashed border-blue-200 rounded-lg px-2 py-1.5">
                                            <span className="text-[10px] text-[#B9BDC1] italic">Trống</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Team 2 slots */}
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-red-500">Đội 2</p>
                                    {t2Players.map((p) => (
                                        <div key={p.userID} className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1.5">
                                            <span className="text-xs">🏸</span>
                                            <span className="text-xs font-medium text-[#141415] truncate">{p.username}</span>
                                        </div>
                                    ))}
                                    {Array.from({ length: playersPerTeam - t2Players.length }).map((_, idx) => (
                                        <div key={`empty-t2-slot-${playersPerTeam - idx}`} className="flex items-center justify-center border border-dashed border-red-200 rounded-lg px-2 py-1.5">
                                            <span className="text-[10px] text-[#B9BDC1] italic">Trống</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Winner banner */}
                    {c.status === "completed" && c.winnerId && (
                        <div className="bg-green-50 px-4 py-2 text-center border-t border-green-100">
                            <span className="text-sm font-bold text-green-600">
                                🏆 {c.winnerId === "team1" ? team1Name : team2Name} thắng kèo!
                            </span>
                        </div>
                    )}

                    {/* Set scores */}
                    <div className="border-t border-gray-100">
                        {Array.from({ length: c.bestOf }, (_, i) => i + 1).map((setNum) => {
                            const scoreData = c.scores?.find((s) => s.set === setNum);
                            const setWinner = scoreData ? getSetWinner(scoreData) : null;
                            const isEditing = editingSet === setNum;

                            return (
                                <div key={setNum} className="flex items-center px-4 py-2 border-b border-gray-50 last:border-b-0">
                                    <span className="text-xs text-[#767A7F] w-12">Set {setNum}</span>

                                    {isEditing ? (
                                        <div className="flex-1 flex items-center justify-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={99}
                                                value={editScore1}
                                                onChange={(e) => setEditScore1(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
                                                className="w-14 text-center bg-white border border-[#046DD6] rounded-lg py-1 text-sm font-bold"
                                            />
                                            <span className="text-xs text-[#767A7F]">-</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={99}
                                                value={editScore2}
                                                onChange={(e) => setEditScore2(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
                                                className="w-14 text-center bg-white border border-[#046DD6] rounded-lg py-1 text-sm font-bold"
                                            />
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={handleSaveScore}
                                                className="ml-1 px-3 py-1 bg-[#046DD6] text-white text-xs rounded-lg font-medium"
                                            >
                                                {actionLoading ? "..." : "Lưu"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingSet(null)}
                                                className="px-2 py-1 text-xs text-[#767A7F]"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center gap-3">
                                            {scoreData ? (
                                                <>
                                                    <span className={`text-sm font-bold ${setWinner === "team1" ? "text-green-600" : "text-[#141415]"}`}>
                                                        {scoreData.score1}
                                                    </span>
                                                    <span className="text-xs text-[#B9BDC1]">-</span>
                                                    <span className={`text-sm font-bold ${setWinner === "team2" ? "text-green-600" : "text-[#141415]"}`}>
                                                        {scoreData.score2}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-[#B9BDC1] italic">Chưa có điểm</span>
                                            )}
                                        </div>
                                    )}

                                    {canEditScores && !isEditing && c.status !== "completed" && (
                                        <button
                                            type="button"
                                            onClick={() => startEditSet(setNum)}
                                            className="text-xs text-[#046DD6] font-medium px-2"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="px-4 mt-4 space-y-2 pb-6">
                    {/* Join open challenge */}
                    {canJoin && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#141415] text-center">Chọn đội để tham gia:</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleJoin("team1")}
                                    disabled={actionLoading || t1Full}
                                    className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                                        t1Full
                                            ? "bg-gray-200 text-gray-400"
                                            : "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                    }`}
                                >
                                    {(() => {
                                        if (t1Full) return "Đội 1 đủ";
                                        if (actionLoading) return "...";
                                        return "🔵 Vào Đội 1";
                                    })()}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleJoin("team2")}
                                    disabled={actionLoading || t2Full}
                                    className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                                        t2Full
                                            ? "bg-gray-200 text-gray-400"
                                            : "bg-red-500 text-white active:bg-red-600"
                                    }`}
                                >
                                    {(() => {
                                        if (t2Full) return "Đội 2 đủ";
                                        if (actionLoading) return "...";
                                        return "🔴 Vào Đội 2";
                                    })()}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Already joined open challenge */}
                    {isOpenMode && c.status === "open" && alreadyJoined && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-green-700 font-medium">✅ Bạn đã tham gia kèo này. Đang chờ đủ người...</p>
                        </div>
                    )}

                    {/* Accept challenge (legacy pending mode) */}
                    {canAccept && (
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={actionLoading}
                            className="w-full py-3 rounded-xl text-sm font-semibold bg-amber-500 text-white active:bg-amber-600 transition-colors"
                        >
                            {actionLoading ? "Đang xử lý..." : "⚔️ Nhận kèo!"}
                        </button>
                    )}

                    {/* Complete challenge */}
                    {canComplete && c.status !== "completed" && (
                        <button
                            type="button"
                            onClick={handleComplete}
                            disabled={actionLoading}
                            className="w-full py-3 rounded-xl text-sm font-semibold bg-green-500 text-white active:bg-green-600 transition-colors"
                        >
                            {actionLoading ? "Đang xử lý..." : "✅ Kết thúc kèo"}
                        </button>
                    )}

                    {/* Error */}
                    {challengeError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                            {challengeError}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default ChallengeDetailPage;
