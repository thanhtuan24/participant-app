import React, { FC, useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate } from "zmp-ui";
import ParticipantSection from "@components/feedback/ParticipantSection";

const CreateScheduleAppointmentPage: FC<any> = () => {
    const getUser = useStore(state => state.getUserInfo);
    
    const [user] = useStore(state => [
        state.user,
    ]);
    const navigate = useNavigate();
    const getSchedule = useStore(state => state.getSchedule);
    const [schedule, gettingSchedule] = useStore(state => [
        state.schedule,
        state.gettingSchedule,
    ]);

    useEffect(() => {
        (async () => {
            
            // eslint-disable-next-line no-unused-expressions
            !user && (await getUser());
        })();
        getSchedule();
    }, []);

    useEffect(() => {
        if (!gettingSchedule && schedule) {
            navigate("/schedule-appointment-result", {
                replace: true,
                animate: false,
            });
        }
    }, [gettingSchedule, schedule]);

    if (!gettingSchedule && schedule) {
        return null;
    }

    return (
        <PageLayout title="Danh sách đăng ký">
            {user ? (
                <ParticipantSection />
            ) : (
                <div/>)}
        </PageLayout>
    );
};

export default CreateScheduleAppointmentPage;
