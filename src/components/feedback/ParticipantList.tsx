/* eslint-disable no-nested-ternary */
import EmptyDataContainer from "@components/common/EmptyDataContainer";
import FeedbackItemSkeleton from "@components/skeleton/FeedbackItemSkeleton";
import {  PartiItem } from "@dts";
import React from "react";
import ParticipantItem from "./ParticipantItem";

export interface ParticipantListProps {
    data: PartiItem[];
    loading?: boolean;
}

const ParticipantList = React.forwardRef<HTMLDivElement, ParticipantListProps>(
    (props, ref) => {
        const { data, loading = true } = props;

        return (
            <div
                id="feedbackList"
                ref={ref}
                className="bg-white rounded-xl mx-3 mt-3 shadow-sm overflow-hidden"
            >
                {data.map((item, index) => (
                    <div key={`fb-item-${item.participantDate}`}>
                        <ParticipantItem 
                            data={item} 
                        />
                        {index !== data.length - 1 && (
                            <div className="mx-3 border-b border-[#F4F5F6]" />
                        )}
                    </div>
                ))}

                {loading ? (
                    [...Array(5)].map((item, index) => (
                        <FeedbackItemSkeleton
                            key={`feedback-item-skeleton-${index}`}
                        />
                    ))
                ) : data.length === 0 ? (
                    <div className="h-[60vh] flex items-center justify-center">
                        <EmptyDataContainer />
                    </div>
                ) : null}
            </div>
        );
    },
);

export default ParticipantList;
