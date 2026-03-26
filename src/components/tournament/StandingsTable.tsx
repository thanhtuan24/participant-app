import React from "react";
import { TeamStanding } from "@dts";

interface Props {
    standings: TeamStanding[];
}

const getPointsDiffClass = (diff: number) => {
    if (diff > 0) return "text-green-600";
    if (diff < 0) return "text-red-500";
    return "text-[#767A7F]";
};

const StandingsTable: React.FC<Props> = ({ standings }) => (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 bg-[#046DD6] text-white text-xs font-semibold">
                Bảng xếp hạng
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 text-[#767A7F]">
                            <th className="text-left px-2 py-2 font-semibold">#</th>
                            <th className="text-left px-2 py-2 font-semibold">Đội</th>
                            <th className="text-center px-1.5 py-2 font-semibold">Đấu</th>
                            <th className="text-center px-1.5 py-2 font-semibold">T</th>
                            <th className="text-center px-1.5 py-2 font-semibold">B</th>
                            <th className="text-center px-1.5 py-2 font-semibold">+/-</th>
                            <th className="text-center px-1.5 py-2 font-semibold text-[#046DD6]">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => (
                            <tr
                                key={s.teamId}
                                className={`border-t border-gray-50 ${
                                    i < 4 ? "bg-blue-50/30" : ""
                                }`}
                            >
                                <td className="px-2 py-2 font-bold text-[#141415]">
                                    {i < 4 ? (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#046DD6] text-white text-[10px]">
                                            {i + 1}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center justify-center w-5 h-5 text-[#767A7F]">
                                            {i + 1}
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-2 font-medium text-[#141415] max-w-[120px] truncate">
                                    {s.teamName}
                                </td>
                                <td className="text-center px-1.5 py-2 text-[#767A7F]">{s.played}</td>
                                <td className="text-center px-1.5 py-2 text-green-600 font-medium">{s.wins}</td>
                                <td className="text-center px-1.5 py-2 text-red-500 font-medium">{s.losses}</td>
                                <td className={`text-center px-1.5 py-2 font-medium ${getPointsDiffClass(s.pointsDiff)}`}>
                                    {s.pointsDiff > 0 ? `+${s.pointsDiff}` : s.pointsDiff}
                                </td>
                                <td className="text-center px-1.5 py-2 font-bold text-[#046DD6]">{s.matchPoints}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

export default StandingsTable;
