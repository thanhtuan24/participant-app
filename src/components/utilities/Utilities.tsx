import React, { FunctionComponent } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import UtilityItem, { UtilityItemProps } from "./UtilityItem";

interface UtilitiesProps {
    utilities: UtilityItemProps & { key: string }[];
}

const UtilitiesWrapper = styled.div`
    ${tw`flex flex-row flex-wrap justify-between bg-ui_bg`};
    padding: 0 16px 16px 16px;
`;
const Utilities: FunctionComponent<UtilitiesProps> = props => {
    const { utilities } = props;
    return (
        <UtilitiesWrapper>
            {utilities.map(item => {
                const { key, ...utility } = item;
                return <UtilityItem key={key} {...utility} />;
            })}
        </UtilitiesWrapper>
    );
};

export default Utilities;
