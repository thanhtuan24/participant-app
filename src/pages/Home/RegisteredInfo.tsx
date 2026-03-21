import React, { FunctionComponent } from "react";
import { Box, Text } from "zmp-ui";
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
    // Lấy user và mainTitle từ store theo cách dễ đọc hơn
    const { mainTitle } = useStore(state => ({
        mainTitle: state.mainTitle
    }));
    const { data, loading = true } = props;

    const renderSkeleton = () => (
        <>
            <Box mb={1}>
                <AvatarSkeleton size={48} />
            </Box>
            <TextItemSkeleton height={22} width={120} />
            <div
                 className="bg-white border-[#D7EDFF] border w-fit px-2 py-0.5 text-[#046DD6] rounded-xl font-medium h-fit"
            >
                Đang cập nhật dữ liệu
            </div>
        </>
    );

    return (
        <div
            className="flex flex-col items-center py-6 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${Background}")` }}
        >
            {!loading && (
                <>
                    <Box mb={1}>
                        <Text color="white" bold size="xLarge" className="tracking-wide text-center">
                            {mainTitle}
                        </Text>
                    </Box>

                    {/* Phần hiển thị ngày và số lượng tham gia */}
                    <div className="flex flex-col items-center gap-1">
                        <Text className="font-medium text-[#ffff33] text-xl font-bold">
                            Ngày {formatDate(new Date(participantDate()), 'dd/mm/yyyy')}
                        </Text>

                        <Text className="text-center text-[#ffff33] text-xl font-bold">
                            Tham gia: {data}
                        </Text>
                    </div>
                </>
            )}
            {loading && renderSkeleton()}
        </div>
    );
};

export default RegisteredInfo;

