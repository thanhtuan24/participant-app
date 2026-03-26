import React, { useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate, useParams } from "react-router-dom";

const AddPlayersPage: React.FC = () => {
    const { id: tournamentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { addPlayer, currentTournament } = useStore((s) => ({
        addPlayer: s.addPlayer,
        currentTournament: s.currentTournament,
    }));

    const [username, setUsername] = useState("");
    const [skillLevel, setSkillLevel] = useState<"A" | "B">("B");
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!username.trim() || !tournamentId) return;
        if (!user?.id) {
            setError("Không lấy được user ID. Tải lại app.");
            return;
        }
        setAdding(true);
        setError(null);
        try {
            const playerUserID = `manual_${Date.now()}`;
            await addPlayer(tournamentId, {
                userID: playerUserID,
                username: username.trim(),
                avatar: "",
                skillLevel,
                adminUserID: user.id,
            });
            setAdded((prev) => [...prev, username.trim()]);
            setUsername("");
        } catch (err: any) {
            setError(`Lỗi: ${err?.message || "Thêm người chơi thất bại"} (uid: ${user.id?.slice(0, 8)}...)`);
        } finally {
            setAdding(false);
        }
    };

    const existingPlayers = currentTournament?.players || [];

    return (
        <PageLayout title="Thêm người chơi">
            <div className="bg-[#F4F5F6] min-h-screen">
                <div className="px-4 py-4 space-y-4">
                    {/* Info banner */}
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-[#046DD6]">
                        <p className="font-semibold">
                            {currentTournament?.type === "doubles"
                                ? "🏸 Giải đôi — Ghép cặp A+B sẽ được random khi bốc thăm"
                                : "🏸 Giải đơn — Mỗi người là 1 đội"}
                        </p>
                    </div>

                    {/* Add form */}
                    <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                        <div>
                            <label htmlFor="player-name" className="block text-sm font-semibold text-[#141415] mb-2">
                                Tên người chơi
                                <input
                                    id="player-name"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nhập tên..."
                                    className="w-full bg-[#F4F5F6] border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-normal text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-[#046DD6] mt-2"
                                    maxLength={50}
                                />
                            </label>
                        </div>

                        <div>
                            <span className="block text-sm font-semibold text-[#141415] mb-2">
                                Trình độ
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSkillLevel("A")}
                                    className={`py-3 rounded-lg text-center border-2 ${
                                        skillLevel === "A"
                                            ? "border-red-400 bg-red-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <span className={`text-sm font-bold ${skillLevel === "A" ? "text-red-500" : "text-[#141415]"}`}>
                                        A — Cao
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSkillLevel("B")}
                                    className={`py-3 rounded-lg text-center border-2 ${
                                        skillLevel === "B"
                                            ? "border-blue-400 bg-blue-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <span className={`text-sm font-bold ${skillLevel === "B" ? "text-blue-500" : "text-[#141415]"}`}>
                                        B — Trung bình
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!username.trim() || adding}
                            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                username.trim() && !adding
                                    ? "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                    : "bg-gray-200 text-gray-400"
                            }`}
                        >
                            {adding ? "Đang thêm..." : "Thêm người chơi"}
                        </button>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Recently added */}
                    {added.length > 0 && (
                        <div className="bg-green-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-green-700 mb-1">✓ Vừa thêm:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {added.map((name) => (
                                    <span key={name} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current players */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#141415]">
                                Danh sách ({existingPlayers.length})
                            </span>
                            <div className="flex gap-2 text-xs">
                                <span className="text-red-500 font-medium">
                                    A: {existingPlayers.filter((p) => p.skillLevel === "A").length}
                                </span>
                                <span className="text-blue-500 font-medium">
                                    B: {existingPlayers.filter((p) => p.skillLevel === "B").length}
                                </span>
                            </div>
                        </div>

                        {existingPlayers.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-[#B9BDC1]">
                                Chưa có người chơi nào
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {existingPlayers.map((p) => (
                                    <div key={p.userID} className="flex items-center gap-3 px-4 py-2.5">
                                        <div className="relative">
                                            {p.avatar ? (
                                                <img src={p.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {p.username?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white ${
                                                p.skillLevel === "A" ? "bg-red-500" : "bg-blue-500"
                                            }`}>
                                                {p.skillLevel}
                                            </span>
                                        </div>
                                        <span className="text-sm text-[#141415] flex-1">{p.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Done button */}
                    <button
                        type="button"
                        onClick={() => navigate(`/tournaments/${tournamentId}`)}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-[#141415] active:bg-gray-50"
                    >
                        ← Quay lại giải đấu
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default AddPlayersPage;
