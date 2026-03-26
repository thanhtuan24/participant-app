/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent } from "react";
import { openChat } from "zmp-sdk";

import WithItem from "./WithItemClick";

export interface UtilityItemProps {
    label?: string;
    icon?: React.ElementType<any>;
    path?: string;
    onClick?: any;
    inDevelopment?: boolean;
    phoneNumber?: string;
    link?: string;
    handleClickUtility?: ({
        inDevelopment,
        path,
        phoneNumber,
        link,
    }: {
        inDevelopment?: boolean | undefined;
        path?: string | undefined;
        phoneNumber?: string | undefined;
        link?: string | undefined;
    }) => void;
}

const UtilityItem: FunctionComponent<UtilityItemProps> = props => {
    const { icon: Icon, label, handleClickUtility } = props;

    const handleClick = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
        event.preventDefault();
        handleClickUtility?.(props);
    };

    return (
        <div
            className="flex flex-col items-center rounded-lg bg-[#F5F9FC] py-2.5 px-1 active:bg-[#E8F0F8] transition-colors cursor-pointer"
            onClick={handleClick}
        >
            {Icon && (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mb-1">
                    <Icon />
                </div>
            )}
            <span className="text-[10px] font-semibold text-center text-[#141415] leading-tight">
                {label}
            </span>
        </div>
    );
};

export default WithItem(UtilityItem);
