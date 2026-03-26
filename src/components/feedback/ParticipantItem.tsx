import { PartiItem } from "@dts";
import React from "react";
import { Icon } from "zmp-ui";
import { PARTICIPANT_STATUS } from "@constants/common";

export interface ParticipantItemProps {
    data: PartiItem;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ data }) => {
    const isRegistered = data.status === PARTICIPANT_STATUS.YES;

    return (
        <div className="flex items-center gap-3 py-3 px-3">
            {/* Left: Status indicator dot */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRegistered ? 'bg-[#0EA5A0]' : 'bg-[#E67E22]'}`} />

            {/* Center: Info */}
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#141415] text-[15px] truncate mb-0.5">
                    {data.username}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#767A7F]">
                    <Icon size={13} icon="zi-clock-1" />
                    <span>{data.participantDate}</span>
                </div>
            </div>

            {/* Right: Status badge */}
            <div
                className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    isRegistered
                        ? 'bg-[#E8F8F5] text-[#0EA5A0] border-[#B2E8E0]'
                        : 'bg-[#FFF3E0] text-[#E67E22] border-[#FDDCB0]'
                }`}
            >
                {isRegistered ? "Có đăng ký" : "Không đăng ký"}
            </div>
        </div>
    );
};

export default ParticipantItem;
