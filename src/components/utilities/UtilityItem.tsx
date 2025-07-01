/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Text } from "zmp-ui";
import { openChat } from "zmp-sdk";

import WithItem from "./WithItemClick";

export interface UtinityItemProps {
    label?: string;
    icon?: React.ElementType<any>;
    path?: string;
    onClick?: any;
    inDevelopment?: boolean;
    phoneNumber?: string;
    link?: string;
    handleClickUtinity?: ({
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

const Wrapper = styled.div`
    ${tw`flex flex-col items-center p-1 mb-2`};
    width: calc(calc(50%) - 12px);
    &:not(:nth-child(2n)) {
        margin-right: 12px;
    }
`;
const IconWrapper = styled.div`
    ${tw`rounded-2xl bg-icon_bg relative`};
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    height: 95px;
`;

const CenterIcon = styled.div`
    ${tw`inline-block `};
`;

const Label = styled(Text)`
    ${tw`text-center`};
    margin-top: 8px;
`;

const UtinityItem: FunctionComponent<UtinityItemProps> = props => {
    const { icon: Icon, label, handleClickUtinity } = props;

    const handleClick = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
        event.preventDefault();
        //  openChat({
        //     type: 'user',
        //     id: '1827485555371003384',
        //     message: 'Hello',
        //     fail: (err) => { console.error  ("Lỗi mở Zalo:", err); }
        //   });
        handleClickUtinity?.(props);
    };

    return (
        <Wrapper onClick={handleClick}>
            {Icon && (
                <IconWrapper>
                    <CenterIcon>
                        <Icon />
                    </CenterIcon>
                </IconWrapper>
            )}
            <Label size="normal" bold>{label}</Label>
        </Wrapper>
    );
};

export default WithItem(UtinityItem);
