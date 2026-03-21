/* eslint-disable no-restricted-syntax */
import React, { useEffect, useState } from "react";
import {
  HomeHeader,
  Utilities,
} from "@components";
import PageLayout from "@components/layout/PageLayout";
import { APP_UTILITIES, participantDate } from "@constants/utilities";
import { useStore } from "@store";
import { getFullParticipant } from "@service/services";
import { PartiItem } from "@dts";
import PresentList from "@components/feedback/PresentList";
import InfiniteScroll from "react-infinite-scroll-component";
// Thêm Box và Text từ zmp-ui để định dạng layout
import { Box, Text } from "zmp-ui";
import RegisteredInfo from "./RegisteredInfo";
import { processAndSortParticipants } from "@utils/participantHelper";

const HomePage: React.FunctionComponent = () => {
  const [organization] = useStore(state => [
    state.organization,
    state.getOrganization,
  ]);

  const { mainTitle, fetchAppConfig, fetchFinanceSummary } = useStore(state => ({
    mainTitle: state.mainTitle,
    fetchAppConfig: state.fetchAppConfig,
    fetchFinanceSummary: state.fetchFinanceSummary,
  }));

  const [todayParticipant, setTodayParticipants] = useState<number | undefined>();
  const [participants, setParticipants] = useState<PartiItem[] | undefined>();


  const fetchParticipants = async () => {
    try {
      const today = participantDate();
      const listParticipant = await getFullParticipant(today);

      const distinctPartiItems = processAndSortParticipants(listParticipant, today);

      const todayRegisteredCount = distinctPartiItems.filter(p => p.status === 'yes').length;
      setParticipants(distinctPartiItems);
      setTodayParticipants(todayRegisteredCount);

    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants(undefined);
    }
  };
  useEffect(() => {

    fetchParticipants();

    fetchAppConfig();
    fetchFinanceSummary(); // Fetch finance info

  }, [fetchAppConfig, fetchFinanceSummary]); // Thêm fetchAppConfig vào dependency array

  return (
    <PageLayout
      id="home-page"
      customHeader={
        <HomeHeader
          title="ĐIỂM DANH CẦU LÔNG G7 TEAM"
          name={organization?.name || ""}
        />
      }
    >
      {/* <UserInfo /> */}
      <RegisteredInfo data={todayParticipant || 0} loading={!(todayParticipant !== undefined)} />
      <Utilities utilities={APP_UTILITIES} />
      <InfiniteScroll
        dataLength={participants?.length || 0}
        next={fetchParticipants}
        hasMore={false}
        loader={null}
        scrollableTarget="feedbacks"
      >
        <PresentList data={participants || []} loading={!participants} /></InfiniteScroll>
    </PageLayout>
  );
};

export default HomePage;
