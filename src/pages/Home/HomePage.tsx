/* eslint-disable no-restricted-syntax */
import React, { useEffect, useState } from "react";
import {
  HomeHeader,
  Utinities,
} from "@components";
import PageLayout from "@components/layout/PageLayout";
import { APP_UTINITIES, participantDate } from "@constants/utinities";
import { useStore } from "@store";
import { getFullParticipant } from "@service/services";
import { PartiItem } from "@dts";
import PresentList from "@components/feedback/PresentList";
import InfiniteScroll from "react-infinite-scroll-component";
// Thêm Box và Text từ zmp-ui để định dạng layout
import { Box, Text } from "zmp-ui";
import RegisteredInfo from "./RegisteredInfo";

const HomePage: React.FunctionComponent = () => {
  const [organization] = useStore(state => [
    state.organization,
    state.getOrganization,
  ]);

  // === BƯỚC 2.1: LẤY STATE VÀ ACTION TỪ ZUSTAND STORE ===
  const { mainTitle, fetchAppConfig } = useStore(state => ({
    mainTitle: state.mainTitle,
    fetchAppConfig: state.fetchAppConfig,
  }));

  const [todayParticipant, setTodayParticipants] = useState<number | undefined>();
  const [participants, setParticipants] = useState<PartiItem[] | undefined>();


  const fetchParticipants = async () => {
    try {
      const today = participantDate();
      const listParticipant = await getFullParticipant(today);

      const participantsMap = new Map();

      // 1. Duyệt qua danh sách một lần để tổng hợp dữ liệu
      for (const p of listParticipant) {
        if (!participantsMap.has(p.userID)) {
          participantsMap.set(p.userID, {
            ...p,
            numberRegistered: 0,
            status: '',
            timestamp: Infinity,
          });
        }

        const userData = participantsMap.get(p.userID);

        if (p.status === 'yes' && p.participantDate !== today) {
          userData.numberRegistered += 1;
        }

        // Cập nhật trạng thái VÀ TIMESTAMP cho ngày hôm nay
        if (p.participantDate === today) {
          userData.status = p.status;
          // === THÊM DÒNG NÀY VÀO ===
          userData.timestamp = p.timestamp; // Cập nhật timestamp của ngày đăng ký hiện tại
          // ==========================
        }
      }

      // 2. Chuyển Map thành mảng và sắp xếp (logic sort của bạn đã đúng)
      const distinctPartiItems = Array.from(participantsMap.values())
        .sort((a, b) => {
          const getPriority = (item) => {
            // ---- SỬA LẠI THỨ TỰ ĐÚNG ----
            if (item.isMember && item.status === 'yes') return 1; // ĐÚNG: 'yes' có ưu tiên cao nhất
            if (item.isMember && item.status === 'no') return 2;  // ĐÚNG: 'no' có ưu tiên thấp hơn
            // ----------------------------

            if (item.isMember) return 4;
            if (!item.isMember && item.status === 'yes') return 3;
            return 5;
          };

          const priorityA = getPriority(a);
          const priorityB = getPriority(b);

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          if (priorityA === 1) {
            return a.timestamp - b.timestamp;
          }

          return 0;
        });

      // 3. Cập nhật state
      const todayRegisteredCount = distinctPartiItems.filter(p => p.status === 'yes').length;
      setParticipants(distinctPartiItems);
      setTodayParticipants(todayRegisteredCount);

    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants(undefined);
    }
  };
  useEffect(() => {

    console.log("Hello");
    fetchParticipants();

    // === BƯỚC 2.2: GỌI ACTION ĐỂ LẤY TITLE ĐỘNG ===
    fetchAppConfig();

  }, [fetchAppConfig]); // Thêm fetchAppConfig vào dependency array

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
    </PageLayout>
  );
};

export default HomePage;
