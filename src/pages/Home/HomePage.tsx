import React, { useEffect, useState } from "react";
import {
  HomeHeader,
  Utinities,
} from "@components";
import PageLayout from "@components/layout/PageLayout";
import { APP_UTINITIES, participantDate } from "@constants/utinities";
import { useStore } from "@store";
import { getTodayParticipant, getFullParticipant } from "@service/services";
import { PartiItem } from "@dts";
import PresentList from "@components/feedback/PresentList";
import InfiniteScroll from "react-infinite-scroll-component";
import RegisteredInfo from "./RegisteredInfo";

const HomePage: React.FunctionComponent = () => {
  const [organization] = useStore(state => [
    state.organization,
    state.getOrganization,
  ]);

  const [todayParticipant, setTodayParticipants] = useState<number | undefined>();
  const [participants, setParticipants] = useState<PartiItem[] | undefined>();


  const fetchParticipants = async () => {
    try {
      const listParticipant = await getFullParticipant(participantDate());
      const filteredPartiItems = listParticipant.filter((item) => {
        return item.status === 'yes' && item.participantDate === participantDate();
      });
      const distinctPartiItems = listParticipant.reduce((acc, current) => {
        console.log("Current:", current);

             if (!acc.find((item) => item.userID === current.userID)) {
              
              current.numberRegistered =  listParticipant.filter((item) => item.userID === current.userID && item.participantDate !== participantDate() && item.status === 'yes').length;
          const todayItem = listParticipant.find((item) => item.userID === current.userID && item.participantDate === participantDate());
          if (todayItem) {
            current.participantDate = todayItem.participantDate;
            current.status = todayItem.status;
          } else {
            current.status = '';
          }
          acc.push(current);
        }
        return acc;
      }, []).sort((a, b) => {
        if (a.status === 'yes' && a.isMember && !(b.status === 'yes' && b.isMember)) {
          return -1;
        } else if (b.status === 'yes' && b.isMember && !(a.status === 'yes' && a.isMember)) {
          return 1;
        } else {
          return a.isMember === b.isMember ? 1 : -1;
        }
      });
      setParticipants(distinctPartiItems);
      setTodayParticipants(filteredPartiItems.length);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants(undefined);
    }
  };
  useEffect(() => {
    (async () => {

      console.log("Hello");
      fetchParticipants();
    })();

  }, []);

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
      <Utinities utinities={APP_UTINITIES} />
      <InfiniteScroll
        dataLength={participants?.length || 0}
        next={fetchParticipants}
        hasMore={false}
        loader={null}
        scrollableTarget="feedbacks"
      >
        <PresentList data={participants || []} loading={!participants} /></InfiniteScroll>
      {/* <ListOA /> */}
      {/* <Contacts /> */}
      {/* <Procedures /> */}
      {/* <NewsSection /> */}
    </PageLayout>
  );
};

export default HomePage;
