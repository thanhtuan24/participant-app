import React, { useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate } from "react-router-dom";

const CreateTournamentPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { createNewTournament, creatingTournament } = useStore((s) => ({
        createNewTournament: s.createNewTournament,
        creatingTournament: s.creatingTournament,
    }));

    const [name, setName] = useState("");
    const [type, setType] = useState<"singles" | "doubles">("doubles");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        if (!name.trim()) {
            setError("Vui lòng nhập tên giải đấu");
            return;
        }
        if (!user?.id) {
            setError("Không lấy được thông tin user. Vui lòng tải lại app.");
            return;
        }
        try {
            const tournamentId = await createNewTournament({
                name: name.trim(),
                type,
                isOpen,
                userID: user.id,
                userName: user.name || "",
            });
            navigate(`/tournaments/${tournamentId}`, { replace: true });
        } catch (err: any) {
            setError(err?.message || "Tạo giải đấu thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <PageLayout title="Tạo giải đấu">
            <div className="bg-[#F4F5F6] min-h-screen">
                <div className="px-4 py-4 space-y-5">
                    {/* Tournament name */}
                    <div>
                        <label htmlFor="tournament-name" className="block text-sm font-semibold text-[#141415] mb-2">
                            Tên giải đấu
                            <input
                                id="tournament-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Giải cầu lông G7 Trophy 2026"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-[#046DD6] focus:ring-1 focus:ring-[#046DD6] mt-2"
                                maxLength={100}
                            />
                        </label>
                    </div>

                    {/* Type selection */}
                    <div>
                        <span className="block text-sm font-semibold text-[#141415] mb-3">
                            Thể thức
                        </span>
                        <div className="grid grid-cols-2 gap-3">
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
                                <p className="text-[10px] text-[#767A7F] mt-0.5">Random ghép A+B</p>
                            </button>
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
                        </div>
                    </div>

                    {/* Open/Internal toggle */}
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#141415]">Giải mở rộng</p>
                                <p className="text-xs text-[#767A7F] mt-0.5">
                                    {isOpen ? "Tất cả mọi người đều thấy giải này" : "Chỉ member nội bộ mới thấy"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                    isOpen ? "bg-[#046DD6]" : "bg-gray-300"
                                }`}
                            >
                                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                                    isOpen ? "translate-x-6" : "translate-x-1"
                                }`} />
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-[#046DD6]">
                        <p className="font-semibold mb-1">ℹ️ Cách thức thi đấu:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            <li>Vòng tròn: tất cả đội gặp nhau</li>
                            <li>Top 4 vào bán kết → chung kết + tranh 3-4</li>
                            <li>Mỗi trận 1 set, 21 điểm</li>
                            {type === "doubles" && <li>Trình độ A+B sẽ được ghép ngẫu nhiên</li>}
                        </ul>
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
                        disabled={!name.trim() || creatingTournament}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                            name.trim() && !creatingTournament
                                ? "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                : "bg-gray-200 text-gray-400"
                        }`}
                    >
                        {creatingTournament ? "Đang tạo..." : "Tạo giải đấu"}
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default CreateTournamentPage;
