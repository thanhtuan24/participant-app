/* eslint-disable no-nested-ternary */
import EmptyDataContainer from "@components/common/EmptyDataContainer";
import {  PartiItem } from "@dts";
import { useStore } from "@store";
import React, { useMemo } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import PresentItem from "./PresentItem";

const Wrapper = styled.div`
    ${tw`bg-ui_bg border-[1px] border-devider_1 rounded mt-4`};
    padding: 16px 8px;
`;

const EmptyWrapper = styled.div`
    ${tw`h-[72vh]`}
`;
const Hr = styled.div`
    ${tw`border-b-[1.5px] border-[#F4F5F6] my-2`}
`;

const HeaderContainer = styled.div`
    ${tw`ml-6 grid justify-items-center`}
`;

const FeedbackType = styled.div`
    ${tw` border-[#D7EDFF] border w-fit px-2 py-0.5 text-[#046DD6] rounded-xl font-medium h-fit`}
`;

export interface ParticipantListProps {
    data: PartiItem[];
    loading?: boolean;
}

const PresentList = React.forwardRef<HTMLDivElement, ParticipantListProps>(
    (props, ref) => {
        const { data, loading = true } = props;
        const { financeSummary } = useStore();
        
        const sortedData = useMemo(() => {
            if (!data || data.length === 0) return [];
            return [...data];
        }, [data]);

        return (
            <Wrapper id="feedbackList" ref={ref}>
                {sortedData.map((item, index) => (
                    <div key={`fb-item-${item.userID}`} >
                        <PresentItem 
                            data={item} 
                            isPaid={financeSummary.paidMembers?.includes(item.userID)}
                        />
                        {index !== sortedData.length - 1 && <Hr />}
                    </div>
                ))}

                {loading ? (
                    <HeaderContainer><FeedbackType
                    style={{backgroundColor:"white",
                        color: "#12AEE2"}}
                >
                    Đang cập nhật danh sách điểm danh
                </FeedbackType></HeaderContainer>
                ) : sortedData.length === 0 ? (
                    <EmptyWrapper>
                        <EmptyDataContainer />
                    </EmptyWrapper>
                ) : (
                    ""
                )}
            </Wrapper>
        );
    },
);

export default PresentList;
