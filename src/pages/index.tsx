import React from "react";
import { Route } from "react-router-dom";
import { AnimationRoutes, ZMPRouter } from "zmp-ui";

import {
    FeedbackPage,
    FeedbackDetailPage,
    CreateFeedbackPage,
} from "./Feedback";
import { GuidelinesPage } from "./Guidelines";
import { HomePage } from "./Home";
import { InformationGuidePage } from "./InformationGuide";
import { CreateScheduleAppointmentPage } from "./CreateScheduleAppointment";
import { AppointmentScheduleResultPage } from "./AppointmentScheduleResult";
import { SearchPage } from "./Search";
import { ProfilePage } from "./Profile";
import {
    TournamentListPage,
    CreateTournamentPage,
    TournamentDetailPage,
    AddPlayersPage,
    MatchScorePage,
} from "./Tournament";
import {
    ChallengeListPage,
    CreateChallengePage,
    ChallengeDetailPage,
} from "./Challenge";
import { AdminPage } from "./Admin";

const Routes: React.FC = () => (
    <ZMPRouter>
        <AnimationRoutes>
            <Route path="/" element={<HomePage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />

            <Route path="/feedbacks" element={<FeedbackPage />} />
            <Route path="/feedbacks/:id" element={<FeedbackDetailPage />} />
            <Route path="/create-feedback" element={<CreateFeedbackPage />} />
            <Route
                path="/create-schedule-appointment"
                element={<CreateScheduleAppointmentPage />}
            />
            <Route
                path="/schedule-appointment-result"
                element={<AppointmentScheduleResultPage />}
            />
            <Route
                path="/information-guide"
                element={<InformationGuidePage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Tournament routes */}
            <Route path="/tournaments" element={<TournamentListPage />} />
            <Route path="/tournaments/create" element={<CreateTournamentPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/tournaments/:id/add-players" element={<AddPlayersPage />} />
            <Route path="/tournaments/:id/match/:matchId" element={<MatchScorePage />} />

            {/* Challenge routes */}
            <Route path="/challenges" element={<ChallengeListPage />} />
            <Route path="/challenges/create" element={<CreateChallengePage />} />
            <Route path="/challenges/:id" element={<ChallengeDetailPage />} />

            {/* Admin route */}
            <Route path="/admin" element={<AdminPage />} />
        </AnimationRoutes>
    </ZMPRouter>
);

export default Routes;
