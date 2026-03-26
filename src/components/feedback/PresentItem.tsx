import { PartiItem } from "@dts";
import React from "react";
import { Icon, Avatar } from "zmp-ui";

export interface ParticipantItemProps {
    data: PartiItem;
    isPaid?: boolean;
}

const formatRegistrationTime = (timestamp: number) => {
    if (!timestamp) return '';
    const dateObject = new Date(timestamp.toString().length < 11 ? timestamp * 1000 : timestamp);
    const month = dateObject.getMonth() + 1;
    const day = dateObject.getDate();
    const hours = dateObject.getHours();
    const minutes = dateObject.getMinutes();
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes} - ${paddedDay}/${paddedMonth}`;
};

const getStatusConfig = (status: string) => {
    if (status === "yes") return {
        label: "Đã đăng ký",
        bg: "bg-[#E8F8F5]",
        text: "text-[#0EA5A0]",
        border: "border-[#B2E8E0]",
    };
    if (status === "no") return {
        label: "Không tham gia",
        bg: "bg-[#FFF3E0]",
        text: "text-[#E67E22]",
        border: "border-[#FDDCB0]",
    };
    return {
        label: "Không đăng ký",
        bg: "bg-[#F4F5F6]",
        text: "text-[#767A7F]",
        border: "border-[#E9EBED]",
    };
};

const getAttendanceColor = (count: number) => {
    if (count > 7) return "#22C55E";
    if (count > 3) return "#EAB308";
    return "#EF4444";
};

const PresentItem: React.FC<ParticipantItemProps> = ({ data, isPaid }) => {
    const formattedTime = data.timestamp ? formatRegistrationTime(data.timestamp) : '';
    const statusCfg = getStatusConfig(data.status || '');

    return (
        <div className="flex items-start gap-3 py-3 px-2">
            {/* Avatar */}
            <div className="flex-shrink-0 pt-0.5">
                <Avatar size={40} src={data.avatar}>
                    {data.username}
                </Avatar>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Row 1: Username + status badge */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#141415] text-[15px] truncate">
                        {data.username}
                    </span>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                    </span>
                </div>

                {/* Row 2: Member type + paid badge */}
                <div className="flex items-center gap-2 mb-0.5">
                    <span
                        className="text-xs font-semibold"
                        style={{ color: data.isMember ? "#4AB5AA" : "#E67E22" }}
                    >
                        {data.isMember ? "Thành viên" : "Vãng lai"}
                    </span>
                    {isPaid && (
                        <span className="inline-flex items-center gap-0.5 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                            <Icon icon="zi-check-circle-solid" size={10} />
                            <span className="text-[9px] font-bold leading-none">ĐÃ ĐÓNG QUỸ</span>
                        </span>
                    )}
                </div>

                {/* Row 3: Attendance count + registration time */}
                <div className="flex items-center justify-between text-xs text-[#767A7F]">
                    <div className="flex items-center gap-3">
                        {data.isMember && (
                            <span className="flex items-center gap-1">
                                <span>Số buổi:</span>
                                <span
                                    className="font-bold"
                                    style={{ color: getAttendanceColor(data.numberRegistered) }}
                                >
                                    {data.numberRegistered}
                                </span>
                            </span>
                        )}
                    </div>
                    {data.status === "yes" && formattedTime && (
                        <span className="flex items-center gap-1 text-[#767A7F]">
                            <Icon size={12} icon="zi-clock-1" />
                            <span>{formattedTime}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PresentItem;
