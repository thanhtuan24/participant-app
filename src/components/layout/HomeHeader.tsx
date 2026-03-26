import React, { FC } from "react";
import { Box } from "zmp-ui";
import styled from "styled-components";
import tw from "twin.macro";
import Logo from "@assets/G7-logo.png";
import TextItemSkeleton from "@components/skeleton/TextSketeton";
import { useStore } from "@store";
import Background from "@assets/header-background.png";
import { useNavigate } from "react-router-dom";
import { SettingsIcon } from "@components/icons";

export interface HomeHeaderProps {
    title: string;
    name: string;
}

const HeaderContainer = styled.div`
    ${tw`flex flex-row bg-main text-white items-center fixed top-0 left-0 w-full px-4 h-[calc(48px + var(--zaui-safe-area-inset-top, 0px))]`};
    padding-top: var(--zaui-safe-area-inset-top);
    z-index: 1;
    background: linear-gradient(
            0deg,
            rgba(4, 109, 214, 0.9),
            rgba(4, 109, 214, 0.9)
        ),
        url("https://picsum.photos/seed/daily/1920/1080");
    background-size: cover;
    background-position: center;
`;

const Title = styled.div`
    ${tw`text-base font-medium`}
`;

const LogoWrapper = styled.div`
    width: 32px;
    height: 32px;
    position: relative;
    margin-right: 8px;
`;

const StyledText = styled.div`
    ${tw`text-wth_a70 text-xs`}
    min-height: 16px;
`;
const AdminButton = styled.button`
    ${tw`mr-2 p-1.5 rounded-full`}
    background: rgba(255,255,255,0.15);
    &:active {
        background: rgba(255,255,255,0.3);
    }
`;

const HomeHeader: FC<HomeHeaderProps> = props => {
    const { title, name } = props;
    const loading = useStore(state => state.gettingOrganization);
    const navigate = useNavigate();
    return (
        <HeaderContainer>
            <AdminButton onClick={() => navigate("/admin")}>
                <SettingsIcon className="w-5 h-5 text-white" />
            </AdminButton>
            <LogoWrapper>
                <img src={Logo} alt={title} />
            </LogoWrapper>
            <Box flex flexDirection="column">
                <Title>{title}</Title>
            </Box>
        </HeaderContainer>
    );
};

export default HomeHeader;
