import React, { FunctionComponent } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { PartiItem } from "@dts";
import { Box, List, Text } from "zmp-ui";
import Item from "./VerticalListItem";

interface VerticalListPorps {
    listParticipant: PartiItem[];
    title?: string;
}

const Wrapper = styled.div`
    ${tw`bg-ui_bg mt-2`};
    padding: 16px;
`;

const VerticalList: FunctionComponent<VerticalListPorps> = props => {
    const { listParticipant, title } = props;
    return (
        <Wrapper>
            <Box mb={4}>
                <Text.Title size="small">{title}</Text.Title>
            </Box>
            <List noSpacing divider={false}>
                {listParticipant.map(item => <Item item={item} key={item.participantDate}>{item.participantDate}</Item>)}
            </List>
        </Wrapper>
    );
};

export default VerticalList;
