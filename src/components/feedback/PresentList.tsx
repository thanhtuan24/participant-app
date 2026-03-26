/* eslint-disable no-nested-ternary */
import EmptyDataContainer from "@components/common/EmptyDataContainer";
import { PartiItem } from "@dts";
import React, { useMemo } from "react";
import PresentItem from "./PresentItem";

export interface ParticipantListProps {
    data: PartiItem[];
    loading?: boolean;
}

const PresentList = React.forwardRef<HTMLDivElement, ParticipantListProps>(
    (props, ref) => {
        const { data, loading = true } = props;

        const sortedData = useMemo(() => {
            if (!data || data.length === 0) return [];
            return [...data];
        }, [data]);

        return (
            <div
                id="feedbackList"
                ref={ref}
                className="bg-white rounded-xl mx-3 mt-3 shadow-sm overflow-hidden"
            >
                {sortedData.map((item, index) => (
                    <div key={`fb-item-${item.userID}`}>
                        <PresentItem
                            data={item}
                        />
                        {index !== sortedData.length - 1 && (
                            <div className="mx-3 border-b border-[#F4F5F6]" />
                        )}
                    </div>
                ))}

                {loading ? (
                    <div className="flex justify-center py-4">
                        <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                            Đang cập nhật danh sách điểm danh
                        </span>
                    </div>
                ) : sortedData.length === 0 ? (
                    <div className="h-[60vh] flex items-center justify-center">
                        <EmptyDataContainer />
                    </div>
                ) : null}
            </div>
        );
    },
);

export default PresentList;
