import React from "react";
import { getTournamentStatusText, getTournamentStatusColor } from "@utils/tournamentHelper";

interface Props {
    status: string;
}

const TournamentStatusBadge: React.FC<Props> = ({ status }) => {
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getTournamentStatusColor(status)}`}>
            {getTournamentStatusText(status)}
        </span>
    );
};

export default TournamentStatusBadge;
