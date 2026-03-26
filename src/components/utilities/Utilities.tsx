import React, { FunctionComponent } from "react";
import UtilityItem, { UtilityItemProps } from "./UtilityItem";

interface UtilitiesProps {
    utilities: UtilityItemProps & { key: string }[];
}

const Utilities: FunctionComponent<UtilitiesProps> = props => {
    const { utilities } = props;
    return (
        <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-white">
            {utilities.map(item => {
                const { key, ...utility } = item;
                return <UtilityItem key={key} {...utility} />;
            })}
        </div>
    );
};

export default Utilities;
