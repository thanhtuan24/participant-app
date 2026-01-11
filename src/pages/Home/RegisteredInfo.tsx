import React, { useState, useEffect, FunctionComponent } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Box, Text } from "zmp-ui";
import Background from "@assets/background.png";
import { useStore } from "@store";
import { AvatarSkeleton, TextItemSkeleton } from "@components/skeleton";
import { participantDate } from "@constants/utinities";
import { getTodayParticipant } from "@service/services";
import { formatDate } from "@utils/date-time";


const Wrapper = styled.div`
    ${tw`flex flex-col items-center`};
    background-image: url("${Background}");
    background-position: center;
    padding: 24px 0;
`;

const FeedbackType = styled.div`
    ${tw` border-[#D7EDFF] border w-fit px-2 py-0.5 text-[#046DD6] rounded-xl font-medium h-fit`}
`;

const TextName = styled(Text)`
    color: #141415;
    font-weight: 500;
`;

const RegisteredInfo: FunctionComponent = (props) => {
    // === BƯỚC 1: LẤY mainTitle TỪ STORE ===
    // Lấy user và mainTitle từ store theo cách dễ đọc hơn
    const { user, mainTitle } = useStore(state => ({
        user: state.user,
        mainTitle: state.mainTitle
    }));
    const { data, loading = true } = props;

    // useEffect(() => {
    //     updateTodayParticipant();
    //   }, []);
    // const [isloading, setIsLoading] = useState<boolean>(true);

    // const [todayParticipant, setTodayParticipant] = useState<number>(0);

    const renderSkeleton = () => (
        <>
            <Box mb={1}>
                <AvatarSkeleton size={48} />
            </Box>
            <TextItemSkeleton height={22} width={120} />
            <FeedbackType
                style={{
                    backgroundColor: "white",
                    color: "#12AEE2"
                }}
            >
                Đang cập nhật dữ liệu
            </FeedbackType>
        </>
    );

    // const updateTodayParticipant = async() => {
    //     console.log(`Parti:${participantDate()}`);
    //     const numberParticipant = await getTodayParticipant(participantDate());
    //     setTodayParticipant(numberParticipant.length);
    //     setIsLoading(false);
    //     return numberParticipant;
    // }
    return (
        <Wrapper>
            {!loading && (
                <>
                    {/* === BƯỚC 2: HIỂN THỊ mainTitle Ở ĐÂY === */}
                    <Box mb={1}>
                        <Text color="white" bold size="xLarge" className="tracking-wide">
                            {"San CDTM 🇻🇳 🔞23:08➡23:08"}
                        </Text>
                    </Box>

                    {/* Phần hiển thị ngày và số lượng tham gia */}
                    <Box className="flex">
                        <TextName color="#ffff33" bold size="xLarge">Ngày {formatDate(new Date(participantDate()), 'dd/mm/yyyy')}</TextName>

                        <TextName align="center" color="#ffff33" bold size="xLarge">Tham gia: {data}</TextName>
                    </Box>

                    { }
                </>
            )}
            {loading && renderSkeleton()}
        </Wrapper>
    );
};

export default RegisteredInfo;

