import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { useNavigate, useParams } from "react-router-dom";
import { TournamentMatch } from "@dts";
import { PlayerBadge, TeamDisplay, MatchCard } from "@components/tournament";
import StandingsTable from "@components/tournament/StandingsTable";
import KnockoutBracket from "@components/tournament/KnockoutBracket";
import TournamentStatusBadge from "@components/tournament/TournamentStatusBadge";
import {
    getGroupMatchesByRound,
    areAllGroupMatchesDone,
    areAllKnockoutMatchesDone,
    sortStandings,
} from "@utils/tournamentHelper";

type TabKey = "players" | "group" | "knockout";

const TournamentDetailPage: React.FC = () => {
    const { id: tournamentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const {
        currentTournament,
        loadingTournamentDetail,
        fetchTournamentDetail,
        generateDraw,
        advanceToKnockout,
        completeTournament,
        removePlayer,
    } = useStore((s) => ({
        currentTournament: s.currentTournament,
        loadingTournamentDetail: s.loadingTournamentDetail,
        fetchTournamentDetail: s.fetchTournamentDetail,
        generateDraw: s.generateDraw,
        advanceToKnockout: s.advanceToKnockout,
        completeTournament: s.completeTournament,
        removePlayer: s.removePlayer,
    }));

    const [activeTab, setActiveTab] = useState<TabKey>("players");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchTournamentDetail(tournamentId);
        }
    }, [tournamentId]);

    // Auto switch tab based on tournament status
    useEffect(() => {
        if (!currentTournament) return;
        if (currentTournament.status === "group_stage") setActiveTab("group");
        else if (currentTournament.status === "knockout" || currentTournament.status === "completed") setActiveTab("knockout");
    }, [currentTournament?.status]);

    if (loadingTournamentDetail || !currentTournament) {
        return (
            <PageLayout title="Giải đấu">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                        Đang tải...
                    </span>
                </div>
            </PageLayout>
        );
    }

    const t = currentTournament;
    const isAdmin = user?.id === t.createdBy;
    const isDoubles = t.type === "doubles";
    const players = t.players || [];
    const teams = t.teams || [];
    const matches = t.matches || [];
    const standings = sortStandings(t.standings || []);
    const matchesByRound = getGroupMatchesByRound(matches);
    const allGroupDone = areAllGroupMatchesDone(matches);
    const allKnockoutDone = areAllKnockoutMatchesDone(matches);

    const handleGenerateDraw = async () => {
        if (!tournamentId || !user?.id) return;
        setActionLoading(true);
        try {
            await generateDraw(tournamentId, user.id);
        } catch { /* handled */ } finally {
            setActionLoading(false);
        }
    };

    const handleAdvance = async () => {
        if (!tournamentId || !user?.id) return;
        setActionLoading(true);
        try {
            await advanceToKnockout(tournamentId, user.id);
        } catch { /* handled */ } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!tournamentId || !user?.id) return;
        setActionLoading(true);
        try {
            await completeTournament(tournamentId, user.id);
        } catch { /* handled */ } finally {
            setActionLoading(false);
        }
    };

    const handleMatchClick = (match: TournamentMatch) => {
        if (match.status === "completed" && !isAdmin) return;
        if (!match.team1Id || !match.team2Id) return;
        navigate(`/tournaments/${tournamentId}/match/${match.id}`);
    };

    const handleRemovePlayer = async (playerID: string) => {
        if (!tournamentId || !user?.id) return;
        try {
            await removePlayer(tournamentId, playerID, user.id);
        } catch { /* handled */ }
    };

    const canEditMatch = (match: TournamentMatch) => {
        if (isAdmin) return match.status !== "completed" && !!match.team1Id && !!match.team2Id;
        // Check if user is a player in the match
        const team1 = teams.find((t2) => t2.id === match.team1Id);
        const team2 = teams.find((t2) => t2.id === match.team2Id);
        const isPlayerInMatch =
            team1?.player1?.userID === user?.id ||
            team1?.player2?.userID === user?.id ||
            team2?.player1?.userID === user?.id ||
            team2?.player2?.userID === user?.id;
        return isPlayerInMatch && match.status !== "completed" && !!match.team1Id && !!match.team2Id;
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: "players", label: `Danh sách (${players.length})` },
        { key: "group", label: "Vòng bảng" },
        { key: "knockout", label: "Chung kết" },
    ];

    return (
        <PageLayout title={t.name}>
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Tournament header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                        <h2 className="text-base font-bold text-[#141415] flex-1 mr-2 line-clamp-1">{t.name}</h2>
                        <TournamentStatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#767A7F]">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                            isDoubles ? "bg-purple-50 text-purple-600" : "bg-sky-50 text-sky-600"
                        }`}>
                            {isDoubles ? "Đôi" : "Đơn"}
                        </span>
                        {t.isOpen && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                                Mở rộng
                            </span>
                        )}
                        {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                                👑 Admin
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-gray-100 px-4 flex gap-0">
                    {tabs.map((tab) => (
                        <button
                            type="button"
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 text-center py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? "border-[#046DD6] text-[#046DD6]"
                                    : "border-transparent text-[#767A7F]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="px-4 py-3">
                    {/* ===== PLAYERS TAB ===== */}
                    {activeTab === "players" && (
                        <div className="space-y-3">
                            {/* Admin actions */}
                            {isAdmin && t.status === "draft" && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/tournaments/${tournamentId}/add-players`)}
                                        className="w-full bg-white border-2 border-dashed border-[#046DD6] text-[#046DD6] font-semibold text-sm py-3 rounded-xl active:bg-[#EBF4FF]"
                                    >
                                        + Thêm người chơi
                                    </button>

                                    {players.length >= 4 && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateDraw}
                                            disabled={actionLoading}
                                            className="w-full bg-[#046DD6] text-white font-semibold text-sm py-3 rounded-xl active:bg-[#0355A8] disabled:bg-gray-300"
                                        >
                                            {actionLoading ? "Đang bốc thăm..." : "🎲 Bốc thăm & Tạo lịch đấu"}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Teams display (after draw) */}
                            {teams.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide px-1">
                                        Đội ({teams.length})
                                    </h4>
                                    {teams.map((team) => (
                                        <div key={team.id} className="bg-white rounded-xl p-3 border border-gray-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-[#046DD6]">{team.id.replace('team_', 'Đội ')}</span>
                                            </div>
                                            <TeamDisplay team={team} isDoubles={isDoubles} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Players list (draft) */}
                            {teams.length === 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide">
                                            Người chơi
                                        </h4>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-red-500 font-medium">
                                                A: {players.filter((p) => p.skillLevel === "A").length}
                                            </span>
                                            <span className="text-blue-500 font-medium">
                                                B: {players.filter((p) => p.skillLevel === "B").length}
                                            </span>
                                        </div>
                                    </div>

                                    {players.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-[#B9BDC1]">
                                            Chưa có người chơi
                                        </div>
                                    ) : (
                                        players.map((p) => (
                                            <PlayerBadge
                                                key={p.userID}
                                                player={p}
                                                showRemove={isAdmin && t.status === "draft"}
                                                onRemove={() => handleRemovePlayer(p.userID)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== GROUP STAGE TAB ===== */}
                    {activeTab === "group" && (
                        <div className="space-y-4">
                            {standings.length === 0 ? (
                                <div className="text-center py-8 text-sm text-[#B9BDC1]">
                                    Chưa có vòng bảng. Cần bốc thăm trước.
                                </div>
                            ) : (
                                <>
                                    {/* Standings */}
                                    <StandingsTable standings={standings} />

                                    {/* Admin advance button */}
                                    {isAdmin && allGroupDone && t.status === "group_stage" && (
                                        <button
                                            type="button"
                                            onClick={handleAdvance}
                                            disabled={actionLoading}
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm py-3 rounded-xl active:opacity-90 disabled:opacity-50"
                                        >
                                            {actionLoading ? "Đang xử lý..." : "🏆 Top 4 vào vòng Knockout"}
                                        </button>
                                    )}

                                    {/* Matches by round */}
                                    {Object.entries(matchesByRound).map(([round, roundMatches]) => (
                                        <div key={round}>
                                            <h4 className="text-xs font-semibold text-[#767A7F] uppercase tracking-wide mb-2 px-1">
                                                Vòng {round}
                                            </h4>
                                            <div className="space-y-2">
                                                {roundMatches.map((m) => (
                                                    <MatchCard
                                                        key={m.id}
                                                        match={m}
                                                        teams={teams}
                                                        isDoubles={isDoubles}
                                                        onClick={() => handleMatchClick(m)}
                                                        canEdit={canEditMatch(m)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== KNOCKOUT TAB ===== */}
                    {activeTab === "knockout" && (
                        <div className="space-y-4">
                            <KnockoutBracket
                                matches={matches}
                                teams={teams}
                                isDoubles={isDoubles}
                                onMatchClick={handleMatchClick}
                                canEdit
                            />

                            {/* Complete tournament */}
                            {isAdmin && allKnockoutDone && t.status === "knockout" && (
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={actionLoading}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm py-3 rounded-xl active:opacity-90 disabled:opacity-50"
                                >
                                    {actionLoading ? "Đang xử lý..." : "✅ Kết thúc giải đấu"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default TournamentDetailPage;
