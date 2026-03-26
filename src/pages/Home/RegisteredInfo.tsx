import React, { FunctionComponent } from "react";
import Background from "@assets/background.png";
import { useStore } from "@store";
import { AvatarSkeleton, TextItemSkeleton } from "@components/skeleton";
import { participantDate } from "@constants/utilities";
import { formatDate } from "@utils/date-time";

interface RegisteredInfoProps {
    data: number;
    loading?: boolean;
}

const RegisteredInfo: FunctionComponent<RegisteredInfoProps> = (props) => {
    const { mainTitle } = useStore(state => ({
        mainTitle: state.mainTitle
    }));
    const { data, loading = true } = props;

    const renderSkeleton = () => (
        <div className="flex flex-col items-center gap-3">
            <AvatarSkeleton size={48} />
            <TextItemSkeleton height={22} width={120} />
            <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 text-white/80 rounded-full text-sm font-medium">
                Đang cập nhật dữ liệu
            </div>
        </div>
    );

    return (
        <div
            className="relative bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${Background}")` }}
        >
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#046DD6]/60 to-[#046DD6]/30" />

            <div className="relative flex flex-col items-center px-4 py-6">
                {!loading ? (
                    <>
                        {/* Title */}
                        <h2 className="text-white font-bold text-lg tracking-wide text-center mb-3 drop-shadow-sm">
                            {mainTitle}
                        </h2>

                        {/* Info badges row */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                                <span className="text-[#FFE566] text-sm">📅</span>
                                <span className="text-white font-semibold text-sm">
                                    Ngày {formatDate(new Date(participantDate()), 'dd/mm/yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                                <span className="text-[#FFE566] text-sm">👥</span>
                                <span className="text-white font-semibold text-sm">
                                    Tham gia: {data}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    renderSkeleton()
                )}
            </div>
        </div>
    );
};

export default RegisteredInfo;

