import { useStore } from "@store";
import React, { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { PartiItem } from "@dts";
import { getUserParticipant } from "@service/services";
import ParticipantList from "./ParticipantList";

const ParticipantSection: React.FC = () => {
    const listRef = useRef<HTMLDivElement>(null);

    const { id: orgId } = useStore(state => state.organization) || {
        id: "",
    };

    const [user, loading] = useStore(state => [
        state.user,
        state.loadingUserInfo,
    ]);

    const [participants, setParticipants] = useState<PartiItem[] | undefined>();

    
    useEffect(() => {
        const fetchParticipants = async () => {
          if (user?.id) {
            try {
              const listParticipant = await getUserParticipant(user.id);
              setParticipants(listParticipant);
            } catch (error) {
              console.error('Error fetching participants:', error);
              setParticipants(undefined);
            }
          } else {
            try {
              const listParticipant = await getUserParticipant("12345");
              setParticipants(listParticipant);
            } catch (error) {
              console.error('Error fetching participants:', error);
              setParticipants(undefined);
            }
          }
        };
        fetchParticipants();
      }, [user]);

    const handleLoadMore = () => {
        if (!orgId) { /* empty */ }
    };

    return (
        <InfiniteScroll
            dataLength={participants?.length || 0}
            next={handleLoadMore}
            hasMore={false}
            loader={null}
            scrollableTarget="participants"
        >
            <ParticipantList data={participants ?? []} ref={listRef} loading={loading} />
        </InfiniteScroll>
    );
};

export default ParticipantSection;
