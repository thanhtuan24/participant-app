import {  PartiItem } from "@dts";
import React from "react";
import { Icon } from "zmp-ui";
import { PARTICIPANT_STATUS } from "@constants/common";

export interface ParticipantItemProps {
    data: PartiItem;
    isPaid?: boolean; // Thêm prop này
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ data, isPaid }) => {
    const isRegistered = data.status === PARTICIPANT_STATUS.YES;
    
    // Icon đóng tiền (chỉ hiển thị nếu đã đóng)
    const PaidBadge = isPaid && (
        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <Icon icon="zi-check-circle-solid" size={14} />
            <span className="text-[10px] font-bold">ĐÃ ĐÓNG QUỸ</span>
        </div>
    );

    return (
        <div className="py-3 px-1">
            <div className="flex justify-between items-center mb-2">
                 <div className="grid grid-cols-2 gap-2 text-[12px] leading-5">
                    <div
                        className="border w-fit px-2 py-0.5 rounded-xl font-medium h-fit"
                        style={{
                            backgroundColor: isRegistered ? "rgba(18, 174, 226, 0.1)" : "orange",
                            color: isRegistered ? "#12AEE2" : "white",
                            borderColor: isRegistered ? "#D7EDFF" : "orange",
                        }}
                    >
                        {isRegistered ? "Có đăng ký" : "Không đăng ký"}
                    </div>
                 </div>
                 {/* Hiển thị badge đóng quỹ */}
                 {PaidBadge}
            </div>

            <div className="flex justify-between items-end">
                <div className="text-[#141414] text-sm font-medium line-clamp-2 flex-1 mr-2">
                    {data.username}
                </div>
                
                <div className="flex items-center gap-1 text-[#767A7F] text-xs whitespace-nowrap">
                        <span>{data.participantDate}</span>
                        <Icon size={14} icon="zi-clock-1" />
                </div>
            </div>
        </div>
    );
};

export default ParticipantItem;
