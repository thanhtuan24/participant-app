import React, { useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { ChallengeCard } from "@components/challenge";
import { useNavigate } from "react-router-dom";

const ChallengeListPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const { challenges, loadingChallenges, fetchChallenges } = useStore((s) => ({
        challenges: s.challenges,
        loadingChallenges: s.loadingChallenges,
        fetchChallenges: s.fetchChallenges,
    }));

    useEffect(() => {
        if (user?.id) {
            fetchChallenges(user.id);
        }
    }, [user?.id]);

    return (
        <PageLayout title="Tạo kèo">
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Header action */}
                <div className="px-4 pt-3 pb-2">
                    <button
                        type="button"
                        className="w-full bg-[#046DD6] text-white font-semibold text-sm py-3 rounded-xl active:bg-[#0355A8] transition-colors"
                        onClick={() => navigate("/challenges/create")}
                    >
                        + Tạo kèo mới
                    </button>
                </div>

                {/* Challenge list */}
                <div className="px-4 pb-4 space-y-3">
                    {loadingChallenges && (
                        <div className="text-center py-8">
                            <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                                Đang tải...
                            </span>
                        </div>
                    )}
                    {!loadingChallenges && challenges.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">⚔️</div>
                            <p className="text-sm text-[#767A7F]">Chưa có kèo nào</p>
                            <p className="text-xs text-[#B9BDC1] mt-1">Tạo kèo đầu tiên để thách đấu!</p>
                        </div>
                    )}
                    {!loadingChallenges && challenges.length > 0 &&
                        challenges.map((c) => (
                            <ChallengeCard key={c.id} challenge={c} />
                        ))
                    }
                </div>
            </div>
        </PageLayout>
    );
};

export default ChallengeListPage;
