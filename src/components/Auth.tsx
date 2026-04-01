import { useEffect } from "react";
import { useStore } from "@store";
import { Events, events } from "zmp-sdk/apis";

const Auth = () => {
    const [token, getToken, user, getUserInfo] = useStore(state => [
        state.token,
        state.getAccessToken,
        state.user,
        state.getUserInfo,
    ]);

    useEffect(() => {
        if (!token) {
            getToken();
        }
        if (!user) {
            getUserInfo();
        }
    }, [token, user]);

    // Khi user quay lại app (sau khi follow OA), retry lấy user info
    useEffect(() => {
        const handleAppResume = () => {
            if (!user?.id) {
                getUserInfo();
            }
        };
        events.on(Events.AppResumed, handleAppResume);
        return () => {
            events.off(Events.AppResumed, handleAppResume);
        };
    }, [user]);

    return null;
};

export default Auth;
