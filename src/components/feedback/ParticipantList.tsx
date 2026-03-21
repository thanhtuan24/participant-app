/* eslint-disable no-nested-ternary */
import EmptyDataContainer from "@components/common/EmptyDataContainer";
import FeedbackItemSkeleton from "@components/skeleton/FeedbackItemSkeleton";
import {  PartiItem } from "@dts";
import { useStore } from "@store";
import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import ParticipantItem from "./ParticipantItem";

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

export interface ParticipantListProps {
    data: PartiItem[];
    loading?: boolean;
}

const ParticipantList = React.forwardRef<HTMLDivElement, ParticipantListProps>(
    (props, ref) => {
        const { data, loading = true } = props;
        const { financeSummary } = useStore();

        return (
            <Wrapper id="feedbackList" ref={ref}>
                {data.map((item, index) => (
                    <div key={`fb-item-${item.participantDate}`}>
                        <ParticipantItem 
                            data={item} 
                            isPaid={financeSummary.paidMembers?.includes(item.userID)}
                        />

                        {index !== data.length - 1 && <Hr />}
                    </div>
                ))}

                {loading ? (
                    [...Array(5)].map((item, index) => (
                        <FeedbackItemSkeleton
                            // eslint-disable-next-line react/no-array-index-key
                            key={`feedback-item-skeleton-${index}`}
                        />
                    ))
                ) : data.length === 0 ? (
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

export default ParticipantList;
