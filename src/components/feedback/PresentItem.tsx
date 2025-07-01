import { PartiItem } from "@dts";
import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Icon, Box, Avatar } from "zmp-ui";

const Container = styled.div`
    ${tw`py-3 px-1 `}
`;

const HeaderContainer = styled.div`
    ${tw`grid-cols-2 flex justify-between gap-1 mb-2 text-[12px] leading-5`}
`;

const TimeContainer = styled.div`
    ${tw`block pl-4 gap-2 text-[#767A7F] text-lg h-fit`}
`;
const FeedbackType = styled.div`
    ${tw`border-[#D7EDFF] border flex flex-col mr-4 text-right items-end w-fit text-sm px-1 py-0.5 font-medium justify-center text-[#046DD6] rounded-xl font-medium`}
`;

const AvatarType = styled.div`
    ${tw`border-[#D7EDFF] gap-1 flex text-right items-center w-fit text-sm px-1 py-0.5 font-medium justify-end text-[#046DD6] rounded-xl font-medium`}
`;


const UsernameText = styled.div`
    ${tw``}
`;

const BodyContainer = styled.div`
    ${tw`text-[#141414]`}
`;

const SmallText = styled.div`
  ${tw`block font-bold text-sm`}
`;

const Content = styled.div`
    ${tw`block  [line-clamp: 3]`}
`;


export interface ParticipantItemProps {
    data: PartiItem;
}

// Helper function to format time to HH:MM:SS
const formatTimeToHHMMSS = (dateTimeInput?: string | Date | number): string => {
    if (dateTimeInput === null || typeof dateTimeInput === 'undefined') return "";
    try {
        const date = new Date(dateTimeInput);
        if (isNaN(date.getTime())) {
            return ""; // Invalid date
        }
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error("Error formatting time:", error);
        return "";
    }
};

const ParticipantItem: React.FC<ParticipantItemProps> = ({ data }) => {
    const formattedTime = data._ts ? formatTimeToHHMMSS(data._ts) : '';

    return (
        <Container>
            <HeaderContainer>
                <TimeContainer>
                    <UsernameText>{(data.username)}</UsernameText>
                    {/* <Icon size={15} icon="zi-clock-1" /> */}
                    <SmallText style={{ color: data.isMember ? "#4AB5AA" : "orange" }}>{data.isMember ? "Thành viên" : "Vãng lai"}</SmallText>

                    {data.isMember ?
                        (<SmallText style={{ color: data.numberRegistered > 7 ? "#00FF77" : data.numberRegistered > 3 ? "#F3DA74" : "red" }}>Số ngày đã đi:{data.numberRegistered}</SmallText>)
                        : (
                            ""
                        )}
                </TimeContainer>
                <AvatarType>
                    <Avatar src={data.avatar}>
                        {data.username}
                    </Avatar>

                    <FeedbackType
                        style={{
                            backgroundColor: data.status === "yes" ? "rgba(18, 174, 226, 0.1)" : (data.status === "no" ? "orange" : "grey"),
                            color: data.status === "yes" ? "#12AEE2" : "white"
                        }}
                    >
                        <span>{data.status === "yes" ? "Đã đăng ký" : (data.status === "no" ? "Không tham gia" : "Không đăng ký")}</span>
                        {data.status === "yes" && formattedTime && <span style={{ fontSize: '0.8em', marginTop: '2px' }}>{formattedTime}</span>}
                    </FeedbackType>
                </AvatarType>
            </HeaderContainer>
        </Container>
    );
};

export default ParticipantItem;
