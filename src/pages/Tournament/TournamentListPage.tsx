import React, { useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { TournamentCard } from "@components/tournament";
import { useNavigate } from "react-router-dom";

const TournamentListPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { tournaments, loadingTournaments, fetchTournaments } = useStore((s) => ({
        tournaments: s.tournaments,
        loadingTournaments: s.loadingTournaments,
        fetchTournaments: s.fetchTournaments,
    }));

    useEffect(() => {
        if (user?.id) {
            fetchTournaments(user.id);
        }
    }, [user?.id]);

    return (
        <PageLayout title="Giải đấu">
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Header action */}
                <div className="px-4 pt-3 pb-2">
                    <button
                        type="button"
                        className="w-full bg-[#046DD6] text-white font-semibold text-sm py-3 rounded-xl active:bg-[#0355A8] transition-colors"
                        onClick={() => navigate("/tournaments/create")}
                    >
                        + Tạo giải đấu mới
                    </button>
                </div>

                {/* Tournament list */}
                <div className="px-4 pb-4 space-y-3">
                    {loadingTournaments && (
                        <div className="text-center py-8">
                            <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                                Đang tải...
                            </span>
                        </div>
                    )}
                    {!loadingTournaments && tournaments.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">🏸</div>
                            <p className="text-sm text-[#767A7F]">Chưa có giải đấu nào</p>
                            <p className="text-xs text-[#B9BDC1] mt-1">Tạo giải đấu đầu tiên cho team!</p>
                        </div>
                    )}
                    {!loadingTournaments && tournaments.length > 0 &&
                        tournaments.map((t) => (
                            <TournamentCard key={t.id} tournament={t} />
                        ))
                    }
                </div>
            </div>
        </PageLayout>
    );
};

export default TournamentListPage;
