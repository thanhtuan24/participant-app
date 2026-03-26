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
import { processAndSortParticipants } from "@utils/participantHelper";
import RestrictedAccess from "@components/common/RestrictedAccess";
import RegisteredInfo from "./RegisteredInfo";

const HomePage: React.FunctionComponent = () => {
  const [organization] = useStore(state => [
    state.organization,
    state.getOrganization,
  ]);

  const {
    fetchAppConfig,
    enableRichFeatures,
    isAuthorizedMember,
    checkingMember,
    checkMemberAccess: checkMember,
    configStatus,
  } = useStore(state => ({
    fetchAppConfig: state.fetchAppConfig,
    enableRichFeatures: state.enableRichFeatures,
    isAuthorizedMember: state.isAuthorizedMember,
    checkingMember: state.checkingMember,
    checkMemberAccess: state.checkMemberAccess,
    configStatus: state.configStatus,
  }));

  const user = useStore(state => state.user);
  const getUserInfo = useStore(state => state.getUserInfo);

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
    fetchAppConfig();
  }, [fetchAppConfig]);

  // Khi config đã load xong và enableRichFeatures bật, kiểm tra member
  useEffect(() => {
    if (configStatus !== 'succeeded') return;
    
    if (enableRichFeatures) {
      // Cần user info để kiểm tra member
      if (!user) {
        getUserInfo();
      } else if (isAuthorizedMember === null) {
        checkMember(user.id);
      }
    }
  }, [configStatus, enableRichFeatures, user, isAuthorizedMember]);

  // Fetch participants khi:
  // - enableRichFeatures=false (mọi người đều xem được)
  // - enableRichFeatures=true VÀ là member
  useEffect(() => {
    if (configStatus !== 'succeeded') return;

    if (!enableRichFeatures || isAuthorizedMember === true) {
      fetchParticipants();
    }
  }, [configStatus, enableRichFeatures, isAuthorizedMember]);

  // enableRichFeatures=true và không phải member → hiển thị restricted
  const showRestricted = enableRichFeatures && isAuthorizedMember === false;
  // Đang chờ kiểm tra member
  const isCheckingAccess = enableRichFeatures && (checkingMember || isAuthorizedMember === null);

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
      <RegisteredInfo data={todayParticipant || 0} loading={!(todayParticipant !== undefined)} />

      {showRestricted ? (
        <RestrictedAccess />
      ) : (
        <>
          <Utilities utilities={APP_UTILITIES} />
          <div className="bg-[#F4F5F6] min-h-[50vh] pb-4">
            {isCheckingAccess ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                  Đang kiểm tra quyền truy cập...
                </span>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={participants?.length || 0}
                next={fetchParticipants}
                hasMore={false}
                loader={null}
                scrollableTarget="feedbacks"
              >
                <PresentList data={participants || []} loading={!participants} />
              </InfiniteScroll>
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default HomePage;
