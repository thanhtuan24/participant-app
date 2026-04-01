import React, { useState, useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate } from "react-router-dom";
import { ChallengeMode } from "@dts";
import { MemberItem } from "@service/adminService";

const BET_OPTIONS = [
    { label: "☕ Cafe", value: "1 ly cafe" },
    { label: "🍗 Gà nhậu", value: "1 con gà nhậu" },
    { label: "🍺 Bia", value: "1 két bia" },
    { label: "✍️ Tùy chọn", value: "" },
];

const BO_OPTIONS = [1, 3, 5];
const POINT_OPTIONS = [11, 15, 21, 30];

const makePlayer = (username: string) => ({
    userID: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: username.trim(),
    avatar: "",
});

type PlayerState = { type: "text"; name: string } | { type: "member"; member: MemberItem };

const PlayerInput: React.FC<{
    label: string;
    player: PlayerState;
    onChange: (p: PlayerState) => void;
    placeholder: string;
    members: MemberItem[];
    isAdmin: boolean;
}> = ({ label, player, onChange, placeholder, members, isAdmin }) => (
    <div className="block">
        <span className="text-xs text-[#767A7F] mb-1 block">{label}</span>
        {isAdmin && members.length > 0 ? (
            <select
                value={player.type === "member" ? player.member.userID : ""}
                onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                        onChange({ type: "text", name: "" });
                    } else {
                        const m = members.find((m) => m.userID === val);
                        if (m) onChange({ type: "member", member: m });
                    }
                }}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#141415] focus:outline-none focus:border-[#046DD6]"
            >
                <option value="">-- Chọn thành viên --</option>
                {members.filter(m => m.isMember).map((m) => (
                    <option key={m.userID} value={m.userID}>{m.username}</option>
                ))}
            </select>
        ) : (
            <input
                type="text"
                value={player.type === "text" ? player.name : player.member.username}
                onChange={(e) => onChange({ type: "text", name: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-[#046DD6]"
                maxLength={30}
                readOnly={player.type === "member"}
            />
        )}
    </div>
);

const CreateChallengePage: React.FC = () => {
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { createNewChallenge, creatingChallenge } = useStore((s) => ({
        createNewChallenge: s.createNewChallenge,
        creatingChallenge: s.creatingChallenge,
    }));
    const { isAdmin, members, fetchMembers } = useStore((s) => ({
        isAdmin: s.isAdmin,
        members: s.members,
        fetchMembers: s.fetchMembers,
    }));

    useEffect(() => {
        if (isAdmin && user?.id && members.length === 0) {
            fetchMembers(user.id);
        }
    }, [isAdmin, user?.id]);

    const [name, setName] = useState("");
    const [mode, setMode] = useState<ChallengeMode>("manual");
    const [type, setType] = useState<"singles" | "doubles">("singles");
    const [betOption, setBetOption] = useState(0);
    const [customBet, setCustomBet] = useState("");
    const [maxPoints, setMaxPoints] = useState(21);
    const [bestOf, setBestOf] = useState(3);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Team players (manual mode only)
    const [t1p1, setT1p1] = useState<PlayerState>({ type: "text", name: "" });
    const [t1p2, setT1p2] = useState<PlayerState>({ type: "text", name: "" });
    const [t2p1, setT2p1] = useState<PlayerState>({ type: "text", name: "" });
    const [t2p2, setT2p2] = useState<PlayerState>({ type: "text", name: "" });

    const isDoubles = type === "doubles";
    const isManual = mode === "manual";
    const betStake = BET_OPTIONS[betOption].value || customBet;
    const isCustomBet = BET_OPTIONS[betOption].value === "";

    const getPlayerName = (p: PlayerState) =>
        p.type === "member" ? p.member.username : p.name;

    const validatePlayers = (): string | null => {
        if (!isManual) return null;
        if (!getPlayerName(t1p1).trim()) return "Nhập tên người chơi đội 1";
        if (!getPlayerName(t2p1).trim()) return "Nhập tên người chơi đội 2";
        if (isDoubles && !getPlayerName(t1p2).trim()) return "Nhập tên người chơi thứ 2 đội 1";
        if (isDoubles && !getPlayerName(t2p2).trim()) return "Nhập tên người chơi thứ 2 đội 2";
        return null;
    };

    const buildPlayer = (p: PlayerState) =>
        p.type === "member"
            ? { userID: p.member.userID, username: p.member.username, avatar: p.member.avatar }
            : makePlayer(p.name);

    const handleSubmit = async () => {
        setError(null);
        if (!name.trim()) { setError("Vui lòng nhập tên kèo"); return; }
        const playerError = validatePlayers();
        if (playerError) { setError(playerError); return; }
        if (!user?.id) { setError("Không lấy được thông tin user. Vui lòng tải lại app."); return; }

        let scheduledAt: number | null = null;
        if (scheduledDate) {
            const dt = scheduledTime ? `${scheduledDate}T${scheduledTime}` : `${scheduledDate}T18:00`;
            scheduledAt = new Date(dt).getTime();
        }

        const payload: Parameters<typeof createNewChallenge>[0] = {
            name: name.trim(),
            type,
            mode,
            betStake,
            maxPoints,
            bestOf,
            scheduledAt,
            userID: user.id,
            userName: user.name || "",
            userAvatar: user.avatar || "",
        };

        if (isManual) {
            const team1Players = [buildPlayer(t1p1)];
            if (isDoubles) team1Players.push(buildPlayer(t1p2));
            const team2Players = [buildPlayer(t2p1)];
            if (isDoubles) team2Players.push(buildPlayer(t2p2));
            payload.team1Players = team1Players;
            payload.team2Players = team2Players;
        }

        try {
            const challengeId = await createNewChallenge(payload);
            navigate(`/challenges/${challengeId}`, { replace: true });
        } catch (err: any) {
            setError(err?.message || "Tạo kèo thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <PageLayout title="Tạo kèo">
            <div className="bg-[#F4F5F6] min-h-screen">
                <div className="px-4 py-4 space-y-5">
                    {/* Challenge name */}
                    <div>
                        <label htmlFor="challenge-name" className="block text-sm font-semibold text-[#141415] mb-2">
                            Tên kèo
                            <input
                                id="challenge-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Kèo cafe thứ 7 tuần này"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-[#046DD6] focus:ring-1 focus:ring-[#046DD6] mt-2"
                                maxLength={100}
                            />
                        </label>
                    </div>

                    {/* Mode selection */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            Hình thức
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMode("manual")}
                                className={`rounded-xl py-3 px-3 text-center border-2 transition-colors ${
                                    mode === "manual"
                                        ? "border-[#046DD6] bg-[#EBF4FF]"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="text-xl mb-1">✍️</div>
                                <p className={`text-xs font-semibold ${mode === "manual" ? "text-[#046DD6]" : "text-[#141415]"}`}>
                                    Tự điền tên
                                </p>
                                <p className="text-[10px] text-[#767A7F] mt-0.5">Điền tất cả người chơi</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("open")}
                                className={`rounded-xl py-3 px-3 text-center border-2 transition-colors ${
                                    mode === "open"
                                        ? "border-[#046DD6] bg-[#EBF4FF]"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="text-xl mb-1">🙋</div>
                                <p className={`text-xs font-semibold ${mode === "open" ? "text-[#046DD6]" : "text-[#141415]"}`}>
                                    Mở nhận kèo
                                </p>
                                <p className="text-[10px] text-[#767A7F] mt-0.5">Mọi người tự vào nhận</p>
                            </button>
                        </div>
                    </div>

                    {/* Type selection */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            Thể thức
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType("singles")}
                                className={`rounded-xl py-4 px-3 text-center border-2 transition-colors ${
                                    type === "singles"
                                        ? "border-[#046DD6] bg-[#EBF4FF]"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="text-2xl mb-1.5">🏸</div>
                                <p className={`text-sm font-semibold ${type === "singles" ? "text-[#046DD6]" : "text-[#141415]"}`}>
                                    Đánh đơn
                                </p>
                                <p className="text-[10px] text-[#767A7F] mt-0.5">1 vs 1</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("doubles")}
                                className={`rounded-xl py-4 px-3 text-center border-2 transition-colors ${
                                    type === "doubles"
                                        ? "border-[#046DD6] bg-[#EBF4FF]"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="text-2xl mb-1.5">👫</div>
                                <p className={`text-sm font-semibold ${type === "doubles" ? "text-[#046DD6]" : "text-[#141415]"}`}>
                                    Đánh đôi
                                </p>
                                <p className="text-[10px] text-[#767A7F] mt-0.5">2 vs 2</p>
                            </button>
                        </div>
                    </div>

                    {/* Team players (manual mode only) */}
                    {isManual && (
                        <div className="space-y-3">
                            <span className="block text-sm font-semibold text-[#141415]">
                                👥 Người chơi
                            </span>

                            {/* Team 1 */}
                            <div className="bg-white rounded-xl p-3 border border-blue-200">
                                <p className="text-xs font-bold text-[#046DD6] mb-2">Đội 1</p>
                                <div className="space-y-2">
                                    <PlayerInput label="Đội 1 - VĐV 1" player={t1p1} onChange={setT1p1} placeholder="Tên VĐV 1" members={members} isAdmin={isAdmin} />
                                    {isDoubles && (
                                        <PlayerInput label="Đội 1 - VĐV 2" player={t1p2} onChange={setT1p2} placeholder="Tên VĐV 2" members={members} isAdmin={isAdmin} />
                                    )}
                                </div>
                            </div>

                            <div className="text-center text-sm font-black text-[#046DD6]">VS</div>

                            {/* Team 2 */}
                            <div className="bg-white rounded-xl p-3 border border-red-200">
                                <p className="text-xs font-bold text-red-500 mb-2">Đội 2</p>
                                <div className="space-y-2">
                                    <PlayerInput label="Đội 2 - VĐV 1" player={t2p1} onChange={setT2p1} placeholder="Tên VĐV 1" members={members} isAdmin={isAdmin} />
                                    {isDoubles && (
                                        <PlayerInput label="Đội 2 - VĐV 2" player={t2p2} onChange={setT2p2} placeholder="Tên VĐV 2" members={members} isAdmin={isAdmin} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Open mode info */}
                    {!isManual && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <p className="text-xs text-blue-700 font-medium mb-1">🙋 Chế độ mở nhận kèo</p>
                            <p className="text-[11px] text-blue-600">
                                Bạn sẽ tự động vào Đội 1. Mọi người sẽ vào kèo chọn đội.
                                Khi đủ {isDoubles ? "4" : "2"} người thì kèo bắt đầu.
                            </p>
                        </div>
                    )}

                    {/* Bet stake */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            🎯 Cược gì?
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {BET_OPTIONS.map((opt, idx) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setBetOption(idx)}
                                    className={`rounded-xl py-2.5 px-3 text-sm font-medium border-2 transition-colors ${
                                        betOption === idx
                                            ? "border-amber-400 bg-amber-50 text-amber-700"
                                            : "border-gray-200 bg-white text-[#141415]"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {isCustomBet && (
                            <input
                                type="text"
                                value={customBet}
                                onChange={(e) => setCustomBet(e.target.value)}
                                placeholder="Nhập cược tùy chọn..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-amber-400 mt-2"
                                maxLength={50}
                            />
                        )}
                    </div>

                    {/* Points per set */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            Điểm mỗi set
                        </span>
                        <div className="flex gap-2">
                            {POINT_OPTIONS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setMaxPoints(p)}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-colors ${
                                        maxPoints === p
                                            ? "border-[#046DD6] bg-[#EBF4FF] text-[#046DD6]"
                                            : "border-gray-200 bg-white text-[#141415]"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Best of */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            Số set (Best of)
                        </span>
                        <div className="flex gap-2">
                            {BO_OPTIONS.map((b) => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => setBestOf(b)}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-colors ${
                                        bestOf === b
                                            ? "border-[#046DD6] bg-[#EBF4FF] text-[#046DD6]"
                                            : "border-gray-200 bg-white text-[#141415]"
                                    }`}
                                >
                                    BO{b}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#767A7F] mt-1.5 ml-1">
                            Thắng {Math.ceil(bestOf / 2)} set là thắng kèo
                        </p>
                    </div>

                    {/* Scheduled date/time */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            📅 Ngày giờ thi đấu
                        </span>
                        <div className="flex flex-col gap-3">
                            <label htmlFor="challenge-date" className="block">
                                <span className="text-xs text-[#767A7F] mb-1 block">Ngày</span>
                                <input
                                    id="challenge-date"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#141415] focus:outline-none focus:border-[#046DD6]"
                                />
                            </label>
                            <label htmlFor="challenge-time" className="block">
                                <span className="text-xs text-[#767A7F] mb-1 block">Giờ</span>
                                <input
                                    id="challenge-time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#141415] focus:outline-none focus:border-[#046DD6]"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!name.trim() || creatingChallenge}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                            name.trim() && !creatingChallenge
                                ? "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                : "bg-gray-200 text-gray-400"
                        }`}
                    >
                        {creatingChallenge ? "Đang tạo..." : "⚔️ Tạo kèo"}
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default CreateChallengePage;
