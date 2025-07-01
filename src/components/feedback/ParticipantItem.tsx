import {  PartiItem } from "@dts";
import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Icon } from "zmp-ui";

const Container = styled.div`
    ${tw`py-3 px-1 `}
`;

const HeaderContainer = styled.div`
    ${tw`grid grid-cols-2 gap-2 mb-2 text-[12px] leading-5`}
`;

const TimeContainer = styled.div`
    ${tw`flex items-center gap-1 font-medium justify-end text-[#767A7F] text-lg `}
`;

const FeedbackType = styled.div`
    ${tw` border-[#D7EDFF] border w-fit px-2 py-0.5 text-[#046DD6] rounded-xl font-medium h-fit`}
`;

const Date = styled.div`
    ${tw``}
`;

const BodyContainer = styled.div`
    ${tw`text-[#141414]`}
`;

const Content = styled.div`
    ${tw`[line-clamp: 3]`}
`;


export interface ParticipantItemProps {
    data: PartiItem;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ data }) => (
        <Container>
            <HeaderContainer>
                <FeedbackType
                    style={{backgroundColor: data.status === "yes" ? "rgba(18, 174, 226, 0.1)" :"orange", 
                        color: data.status === "yes" ? "#12AEE2" : "white"}}
                >
                    {data.status==="yes"?"Có đăng ký":"Không đăng ký"}
                </FeedbackType>
                <TimeContainer>
                    <Date>{(data.participantDate)}</Date>
                    <Icon size={15} icon="zi-clock-1" />
                </TimeContainer>
            </HeaderContainer>

            <BodyContainer>
                <Content>{data.id}</Content>
            </BodyContainer>
        </Container>
    );

export default ParticipantItem;
