import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useParams } from "react-router-dom";
import { ChallengeStatusBadge } from "@components/challenge";

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
        updateChallengeAction,
        completeChallengeAction,
        clearChallengeError,
    } = useStore((s) => ({
        currentChallenge: s.currentChallenge,
        loadingChallengeDetail: s.loadingChallengeDetail,
        challengeError: s.challengeError,
        fetchChallengeDetail: s.fetchChallengeDetail,
        acceptChallengeAction: s.acceptChallengeAction,
        joinChallengeAction: s.joinChallengeAction,
        updateChallengeAction: s.updateChallengeAction,
        completeChallengeAction: s.completeChallengeAction,
        clearChallengeError: s.clearChallengeError,
    }));

    const { isAdmin, members, fetchMembers } = useStore((s) => ({
        isAdmin: s.isAdmin,
        members: s.members,
        fetchMembers: s.fetchMembers,
    }));

    const [actionLoading, setActionLoading] = useState(false);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editBetStake, setEditBetStake] = useState("");
    const [editScheduledAt, setEditScheduledAt] = useState("");
    const [editScores, setEditScores] = useState<{ set: number; score1: number; score2: number }[]>([]);

    // Admin add-member state
    const [showAdminAdd, setShowAdminAdd] = useState(false);
    const [adminPickedMember, setAdminPickedMember] = useState("");
    const [adminPickedTeam, setAdminPickedTeam] = useState<"team1" | "team2">("team1");

    useEffect(() => {
        if (challengeId) {
            fetchChallengeDetail(challengeId);
        }
        return () => clearChallengeError();
    }, [challengeId]);

    useEffect(() => {
        if (isAdmin && user?.id && members.length === 0) {
            fetchMembers(user.id);
        }
    }, [isAdmin, user?.id]);

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
    const isParticipant =
        c.team1?.players?.some((p) => p.userID === user?.id) ||
        c.team2?.players?.some((p) => p.userID === user?.id);
    const canEdit = (isCreator || isParticipant) && c.status !== "completed";

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
    const canComplete =
        (c.status === "accepted" || c.status === "in_progress") && !!user?.id && c.scores && c.scores.length > 0;

    const getSetWinner = (s: { score1: number; score2: number }): string | null => {
        if (s.score1 > s.score2) return "team1";
        if (s.score2 > s.score1) return "team2";
        return null;
    };

    const t1SetWins = (c.scores || []).filter((s) => getSetWinner(s) === "team1").length;
    const t2SetWins = (c.scores || []).filter((s) => getSetWinner(s) === "team2").length;
    const setsToWin = Math.ceil(c.bestOf / 2);

    const enterEditMode = () => {
        setEditName(c.name);
        setEditBetStake(c.betStake || "");
        setEditScheduledAt(
            c.scheduledAt
                ? new Date(c.scheduledAt).toISOString().slice(0, 16)
                : "",
        );
        const initialScores = Array.from({ length: c.bestOf }, (_, i) => {
            const existing = c.scores?.find((s) => s.set === i + 1);
            return { set: i + 1, score1: existing?.score1 ?? 0, score2: existing?.score2 ?? 0 };
        });
        setEditScores(initialScores);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            const payload: Parameters<typeof updateChallengeAction>[2] = {
                scores: editScores,
            };
            if (isCreator) {
                payload.name = editName;
                payload.betStake = editBetStake;
                payload.scheduledAt = editScheduledAt
                    ? new Date(editScheduledAt).getTime()
                    : null;
            }
            await updateChallengeAction(challengeId, user.id, payload);
            setIsEditing(false);
        } catch {
            /* error shown via challengeError */
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleAdminAdd = async () => {
        if (!challengeId || !adminPickedMember) return;
        const member = members.find((m) => m.userID === adminPickedMember);
        if (!member) return;
        setActionLoading(true);
        try {
            await joinChallengeAction(challengeId, {
                userID: member.userID,
                userName: member.username,
                userAvatar: member.avatar || "",
                team: adminPickedTeam,
            });
            setShowAdminAdd(false);
            setAdminPickedMember("");
        } catch { /* handled */ } finally { setActionLoading(false); }
    };

    const handleAccept = async () => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await acceptChallengeAction(challengeId, {
                userID: user.id,
                userName: user.name || "",
                userAvatar: user.avatar || "",
            });
        } catch { /* handled */ } finally { setActionLoading(false); }
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
        } catch { /* handled */ } finally { setActionLoading(false); }
    };

    const handleComplete = async () => {
        if (!challengeId || !user?.id) return;
        setActionLoading(true);
        try {
            await completeChallengeAction(challengeId, user.id);
        } catch { /* handled */ } finally { setActionLoading(false); }
    };

    const updateEditScore = (set: number, field: "score1" | "score2", value: string) => {
        const num = Math.max(0, parseInt(value, 10) || 0);
        setEditScores((prev) => prev.map((s) => s.set === set ? { ...s, [field]: num } : s));
    };

    return (
        <PageLayout title="Chi tiết kèo">
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                        {isEditing && isCreator ? (
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 mr-2 text-base font-bold text-[#141415] border-b-2 border-[#046DD6] bg-transparent outline-none"
                            />
                        ) : (
                            <h2 className="text-base font-bold text-[#141415] flex-1 mr-2">{c.name}</h2>
                        )}
                        <div className="flex items-center gap-2">
                            <ChallengeStatusBadge status={c.status} />
                            {canEdit && !isEditing && (
                                <button
                                    type="button"
                                    onClick={enterEditMode}
                                    className="text-xs font-semibold text-[#046DD6] bg-[#EBF4FF] px-2.5 py-1 rounded-full"
                                >
                                    ✏️ Sửa
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs text-[#767A7F]">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                            c.type === "doubles" ? "bg-purple-50 text-purple-600" : "bg-sky-50 text-sky-600"
                        }`}>
                            {c.type === "doubles" ? "Đôi" : "Đơn"}
                        </span>
                        <span>{c.maxPoints} điểm/set</span>
                        <span>BO{c.bestOf}</span>
                        {isEditing && isCreator ? (
                            <input
                                value={editBetStake}
                                onChange={(e) => setEditBetStake(e.target.value)}
                                placeholder="Cược gì?"
                                className="px-2 py-0.5 rounded-full border border-[#046DD6] text-[#046DD6] bg-white outline-none text-xs w-28"
                            />
                        ) : c.betStake ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                                🎯 {c.betStake}
                            </span>
                        ) : null}
                    </div>
                    <div className="mt-2">
                        {isEditing && isCreator ? (
                            <input
                                type="datetime-local"
                                value={editScheduledAt}
                                onChange={(e) => setEditScheduledAt(e.target.value)}
                                className="text-xs text-[#767A7F] border-b border-[#046DD6] bg-transparent outline-none"
                            />
                        ) : c.scheduledAt ? (
                            <p className="text-xs text-[#767A7F]">
                                📅 {new Date(c.scheduledAt).toLocaleDateString("vi-VN", {
                                    weekday: "long", day: "2-digit", month: "2-digit",
                                    year: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="mx-4 mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Team names + overall score */}
                    <div className="flex items-center px-4 py-3">
                        <div className="flex-1 text-center">
                            <p className="text-sm font-bold text-[#141415] break-words">{team1Name}</p>
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
                            <p className={`text-sm font-bold break-words ${c.team2 ? "text-[#141415]" : "text-[#B9BDC1] italic"}`}>
                                {team2Name}
                            </p>
                            {isOpenMode && (
                                <p className="text-[10px] text-[#767A7F]">
                                    {t2Players.length}/{playersPerTeam} người
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Open mode player slots */}
                    {isOpenMode && c.status === "open" && (
                        <div className="border-t border-gray-100 px-4 py-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-[#046DD6]">Đội 1</p>
                                    {t1Players.map((p) => (
                                        <div key={p.userID} className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2 py-1.5">
                                            <span className="text-xs">🏸</span>
                                            <span className="text-xs font-medium text-[#141415] truncate">{p.username}</span>
                                        </div>
                                    ))}
                                    {Array.from({ length: playersPerTeam - t1Players.length }).map((_, idx) => (
                                        <div key={`empty-t1-${idx}`} className="flex items-center justify-center border border-dashed border-blue-200 rounded-lg px-2 py-1.5">
                                            <span className="text-[10px] text-[#B9BDC1] italic">Trống</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-red-500">Đội 2</p>
                                    {t2Players.map((p) => (
                                        <div key={p.userID} className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1.5">
                                            <span className="text-xs">🏸</span>
                                            <span className="text-xs font-medium text-[#141415] truncate">{p.username}</span>
                                        </div>
                                    ))}
                                    {Array.from({ length: playersPerTeam - t2Players.length }).map((_, idx) => (
                                        <div key={`empty-t2-${idx}`} className="flex items-center justify-center border border-dashed border-red-200 rounded-lg px-2 py-1.5">
                                            <span className="text-[10px] text-[#B9BDC1] italic">Trống</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Admin: add member on behalf */}
                            {isAdmin && (t1Players.length < playersPerTeam || t2Players.length < playersPerTeam) && (
                                <div className="mt-3">
                                    {!showAdminAdd ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminAdd(true)}
                                            className="w-full text-xs font-semibold text-[#046DD6] border border-dashed border-[#046DD6] rounded-lg py-2 active:bg-[#EBF4FF]"
                                        >
                                            👑 Thêm thành viên thay người khác
                                        </button>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                                            <p className="text-xs font-bold text-amber-700">👑 Admin — Thêm thành viên</p>
                                            <select
                                                value={adminPickedMember}
                                                onChange={(e) => setAdminPickedMember(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#141415] focus:outline-none focus:border-[#046DD6]"
                                            >
                                                <option value="">-- Chọn thành viên --</option>
                                                {members
                                                    .filter((m) => ![...t1Players, ...t2Players].some((p) => p.userID === m.userID))
                                                    .map((m) => (
                                                        <option key={m.userID} value={m.userID}>
                                                            {m.username || m.userID}{m.isMember ? " ⭐" : ""}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setAdminPickedTeam("team1")}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-colors ${adminPickedTeam === "team1" ? "border-[#046DD6] bg-[#EBF4FF] text-[#046DD6]" : "border-gray-200 bg-white text-[#767A7F]"} ${t1Full ? "opacity-40 pointer-events-none" : ""}`}
                                                >
                                                    🔵 Đội 1
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdminPickedTeam("team2")}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-colors ${adminPickedTeam === "team2" ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 bg-white text-[#767A7F]"} ${t2Full ? "opacity-40 pointer-events-none" : ""}`}
                                                >
                                                    🔴 Đội 2
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAdminAdd}
                                                    disabled={!adminPickedMember || actionLoading}
                                                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#046DD6] text-white disabled:bg-gray-200 disabled:text-gray-400"
                                                >
                                                    {actionLoading ? "Đang thêm..." : "Thêm vào kèo"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowAdminAdd(false); setAdminPickedMember(""); }}
                                                    className="px-3 py-2 rounded-lg text-xs text-[#767A7F] bg-white border border-gray-200"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                        {isEditing ? (
                            // Edit mode: all sets editable at once
                            editScores.map((s) => (
                                <div key={s.set} className="flex items-center px-4 py-2.5 border-b border-gray-50 last:border-b-0">
                                    <span className="text-xs text-[#767A7F] w-12">Set {s.set}</span>
                                    <div className="flex-1 flex items-center justify-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={s.score1}
                                            onChange={(e) => updateEditScore(s.set, "score1", e.target.value)}
                                            className="w-14 text-center bg-white border-2 border-[#046DD6] rounded-lg py-1 text-sm font-bold outline-none"
                                        />
                                        <span className="text-xs text-[#767A7F]">-</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={s.score2}
                                            onChange={(e) => updateEditScore(s.set, "score2", e.target.value)}
                                            className="w-14 text-center bg-white border-2 border-[#046DD6] rounded-lg py-1 text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            // View mode
                            Array.from({ length: c.bestOf }, (_, i) => i + 1).map((setNum) => {
                                const scoreData = c.scores?.find((s) => s.set === setNum);
                                const setWinner = scoreData ? getSetWinner(scoreData) : null;
                                return (
                                    <div key={setNum} className="flex items-center px-4 py-2 border-b border-gray-50 last:border-b-0">
                                        <span className="text-xs text-[#767A7F] w-12">Set {setNum}</span>
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
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="px-4 mt-4 space-y-2 pb-6">
                    {/* Edit mode: Save / Cancel */}
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl text-sm font-semibold bg-[#046DD6] text-white active:bg-[#0355A8] disabled:bg-gray-300"
                            >
                                {actionLoading ? "Đang lưu..." : "💾 Lưu thay đổi"}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="w-full py-2.5 rounded-xl text-sm font-medium text-[#767A7F] bg-white border border-gray-200"
                            >
                                Hủy chỉnh sửa
                            </button>
                        </>
                    )}

                    {/* Normal actions (only when not editing) */}
                    {!isEditing && (
                        <>
                            {canJoin && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-[#141415] text-center">Chọn đội để tham gia:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleJoin("team1")}
                                            disabled={actionLoading || t1Full}
                                            className={`py-3 rounded-xl text-sm font-semibold transition-colors ${t1Full ? "bg-gray-200 text-gray-400" : "bg-[#046DD6] text-white active:bg-[#0355A8]"}`}
                                        >
                                            {t1Full ? "Đội 1 đủ" : actionLoading ? "..." : "🔵 Vào Đội 1"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleJoin("team2")}
                                            disabled={actionLoading || t2Full}
                                            className={`py-3 rounded-xl text-sm font-semibold transition-colors ${t2Full ? "bg-gray-200 text-gray-400" : "bg-red-500 text-white active:bg-red-600"}`}
                                        >
                                            {t2Full ? "Đội 2 đủ" : actionLoading ? "..." : "🔴 Vào Đội 2"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isOpenMode && c.status === "open" && alreadyJoined && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-green-700 font-medium">✅ Bạn đã tham gia kèo này. Đang chờ đủ người...</p>
                                </div>
                            )}

                            {canAccept && (
                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                    className="w-full py-3 rounded-xl text-sm font-semibold bg-amber-500 text-white active:bg-amber-600"
                                >
                                    {actionLoading ? "Đang xử lý..." : "⚔️ Nhận kèo!"}
                                </button>
                            )}

                            {canComplete && c.status !== "completed" && (
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={actionLoading}
                                    className="w-full py-3 rounded-xl text-sm font-semibold bg-green-500 text-white active:bg-green-600"
                                >
                                    {actionLoading ? "Đang xử lý..." : "✅ Kết thúc kèo"}
                                </button>
                            )}
                        </>
                    )}

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
