import React from "react";
import { ChallengeStatus } from "@dts";

const STATUS_MAP: Record<ChallengeStatus, { label: string; className: string }> = {
    open: { label: "Đang tìm người", className: "bg-teal-50 text-teal-600" },
    pending: { label: "Chờ đối thủ", className: "bg-amber-50 text-amber-600" },
    accepted: { label: "Đã nhận kèo", className: "bg-blue-50 text-blue-600" },
    in_progress: { label: "Đang đấu", className: "bg-purple-50 text-purple-600" },
    completed: { label: "Hoàn tất", className: "bg-green-50 text-green-600" },
    cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-500" },
};

const ChallengeStatusBadge: React.FC<{ status: ChallengeStatus }> = ({ status }) => {
    const { label, className } = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${className}`}>
            {label}
        </span>
    );
};

export default ChallengeStatusBadge;
