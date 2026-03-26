import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { useStore } from "@store";
import { MemberItem } from "@service/adminService";

const AdminPage: React.FC = () => {
    const user = useStore((s) => s.user);
    const getUserInfo = useStore((s) => s.getUserInfo);
    const {
        adminConfig,
        isAdmin,
        noAdmin,
        members,
        loadingAdminConfig,
        loadingMembers,
        adminError,
        fetchAdminConfig,
        updateAdminConfig,
        setNewAdmin,
        fetchMembers,
        addMemberAction,
        removeMemberAction,
        clearAdminError,
    } = useStore((s) => ({
        adminConfig: s.adminConfig,
        isAdmin: s.isAdmin,
        noAdmin: s.noAdmin,
        members: s.members,
        loadingAdminConfig: s.loadingAdminConfig,
        loadingMembers: s.loadingMembers,
        adminError: s.adminError,
        fetchAdminConfig: s.fetchAdminConfig,
        updateAdminConfig: s.updateAdminConfig,
        setNewAdmin: s.setNewAdmin,
        fetchMembers: s.fetchMembers,
        addMemberAction: s.addMemberAction,
        removeMemberAction: s.removeMemberAction,
        clearAdminError: s.clearAdminError,
    }));

    const [mainTitle, setMainTitle] = useState("");
    const [enableRich, setEnableRich] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [tab, setTab] = useState<"config" | "members">("config");

    useEffect(() => {
        if (!user) {
            getUserInfo();
        }
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchAdminConfig(user.id);
        }
    }, [user?.id]);

    useEffect(() => {
        if (adminConfig) {
            setMainTitle(adminConfig.mainTitle || "");
            setEnableRich(!!adminConfig.enableRichFeatures);
        }
    }, [adminConfig]);

    useEffect(() => {
        if ((isAdmin || noAdmin) && user?.id && tab === "members") {
            fetchMembers(user.id);
        }
    }, [isAdmin, noAdmin, user?.id, tab]);

    useEffect(() => () => clearAdminError(), []);

    const handleClaimAdmin = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            await setNewAdmin(user.id, user.id);
            setSuccessMsg("Bạn đã trở thành Admin!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch {
            // error from store
        } finally {
            setSaving(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            await updateAdminConfig({
                userID: user.id,
                mainTitle: mainTitle.trim(),
                enableRichFeatures: enableRich,
            });
            setSuccessMsg("Đã lưu cấu hình!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch {
            // error from store
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMember = async (member: MemberItem) => {
        if (!user?.id) return;
        try {
            if (member.isMember) {
                await removeMemberAction(user.id, member.userID);
            } else {
                await addMemberAction(user.id, member.userID);
            }
        } catch {
            // error from store
        }
    };

    const handleSetAdmin = async (member: MemberItem) => {
        if (!user?.id) return;
        // eslint-disable-next-line no-restricted-globals, no-alert
        const confirmed = window.confirm(`Chuy\u1ec3n quy\u1ec1n admin cho ${member.username || member.userID}?`);
        if (!confirmed) return;
        try {
            await setNewAdmin(user.id, member.userID);
            setSuccessMsg(`Đã chuyển quyền Admin cho ${member.username}!`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch {
            // error from store
        }
    };

    if (loadingAdminConfig) {
        return (
            <PageLayout title="Quản trị">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                        Đang tải...
                    </span>
                </div>
            </PageLayout>
        );
    }

    // No admin yet → offer to claim
    if (noAdmin && !isAdmin) {
        return (
            <PageLayout title="Quản trị">
                <div className="bg-[#F4F5F6] min-h-screen">
                    <div className="px-4 py-8 text-center space-y-4">
                        <div className="text-4xl">👑</div>
                        <h2 className="text-base font-bold text-[#141415]">Chưa có Admin</h2>
                        <p className="text-sm text-[#767A7F]">
                            Hệ thống chưa có ai làm Admin. Bạn có muốn nhận quyền Admin?
                        </p>
                        <button
                            type="button"
                            onClick={handleClaimAdmin}
                            disabled={saving}
                            className="bg-[#046DD6] text-white font-semibold text-sm py-3 px-6 rounded-xl active:bg-[#0355A8] transition-colors"
                        >
                            {saving ? "Đang xử lý..." : "👑 Nhận quyền Admin"}
                        </button>
                        {adminError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                                {adminError}
                            </div>
                        )}
                    </div>
                </div>
            </PageLayout>
        );
    }

    // Not admin
    if (!isAdmin) {
        return (
            <PageLayout title="Quản trị">
                <div className="bg-[#F4F5F6] min-h-screen">
                    <div className="px-4 py-8 text-center space-y-3">
                        <div className="text-4xl">🔒</div>
                        <h2 className="text-base font-bold text-[#141415]">Không có quyền truy cập</h2>
                        <p className="text-sm text-[#767A7F]">
                            Chỉ Admin mới có thể sử dụng trang quản trị.
                        </p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Quản trị">
            <div className="bg-[#F4F5F6] min-h-screen">
                {/* Tabs */}
                <div className="flex bg-white border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => setTab("config")}
                        className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                            tab === "config"
                                ? "text-[#046DD6] border-b-2 border-[#046DD6]"
                                : "text-[#767A7F]"
                        }`}
                    >
                        ⚙️ Cấu hình
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("members")}
                        className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                            tab === "members"
                                ? "text-[#046DD6] border-b-2 border-[#046DD6]"
                                : "text-[#767A7F]"
                        }`}
                    >
                        👥 Thành viên
                    </button>
                </div>

                {/* Success message */}
                {successMsg && (
                    <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium text-center">
                        ✅ {successMsg}
                    </div>
                )}

                {/* Error */}
                {adminError && (
                    <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                        {adminError}
                    </div>
                )}

                {/* Config tab */}
                {tab === "config" && (
                    <div className="px-4 py-4 space-y-5">
                        {/* Main title */}
                        <div>
                            <label htmlFor="admin-title" className="block text-sm font-semibold text-[#141415] mb-2">
                                Tiêu đề chính
                                <input
                                    id="admin-title"
                                    type="text"
                                    value={mainTitle}
                                    onChange={(e) => setMainTitle(e.target.value)}
                                    placeholder="VD: Sân Cầu Lông G7"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-[#141415] placeholder:text-[#B9BDC1] focus:outline-none focus:border-[#046DD6] mt-2"
                                    maxLength={100}
                                />
                            </label>
                        </div>

                        {/* Enable rich features */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#141415]">Kiểm tra quyền truy cập</p>
                                    <p className="text-[11px] text-[#767A7F] mt-0.5">
                                        Bật: chỉ thành viên VIP xem được danh sách. Tắt: mọi người đều xem được.
                                    </p>
                                </div>
                                <div
                                    role="switch"
                                    aria-checked={enableRich}
                                    tabIndex={0}
                                    onClick={() => setEnableRich(!enableRich)}
                                    onKeyDown={() => {}}
                                    style={{ width: 48, height: 28, flexShrink: 0 }}
                                    className={`relative rounded-full cursor-pointer transition-colors ${
                                        enableRich ? "bg-[#046DD6]" : "bg-gray-300"
                                    }`}
                                >
                                    <span
                                        style={{
                                            width: 24, height: 24,
                                            top: 2,
                                            left: enableRich ? 22 : 2,
                                            transition: "left 0.2s",
                                        }}
                                        className="absolute bg-white rounded-full shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin info */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <p className="text-sm font-semibold text-[#141415] mb-1">👑 Admin hiện tại</p>
                            <p className="text-xs text-[#767A7F]">
                                {user?.name || user?.id || "Bạn"}
                            </p>
                        </div>

                        {/* Save */}
                        <button
                            type="button"
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                                !saving
                                    ? "bg-[#046DD6] text-white active:bg-[#0355A8]"
                                    : "bg-gray-200 text-gray-400"
                            }`}
                        >
                            {saving ? "Đang lưu..." : "💾 Lưu cấu hình"}
                        </button>
                    </div>
                )}

                {/* Members tab */}
                {tab === "members" && (
                    <div className="px-4 py-4">
                        {loadingMembers && (
                            <div className="text-center py-8">
                                <span className="text-sm text-[#046DD6] bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">
                                    Đang tải...
                                </span>
                            </div>
                        )}
                        {!loadingMembers && members.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-3xl mb-2">👥</div>
                                <p className="text-sm text-[#767A7F]">Chưa có user nào trong hệ thống</p>
                                <p className="text-[11px] text-[#B9BDC1] mt-1">User sẽ xuất hiện khi họ sử dụng app</p>
                            </div>
                        )}
                        {!loadingMembers && members.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-[#767A7F] mb-2">
                                    Tổng: {members.length} user · {members.filter((m) => m.isMember).length} thành viên VIP
                                </p>
                                {members.map((member) => (
                                    <div
                                        key={member.userID}
                                        className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm text-[#767A7F]">👤</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#141415] truncate">
                                                {member.username || member.userID.slice(0, 12)}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {member.isMember && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                                                        VIP
                                                    </span>
                                                )}
                                                {adminConfig?.adminId === member.userID && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                                                        👑 Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleMember(member)}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                                                    member.isMember
                                                        ? "bg-red-50 text-red-500 active:bg-red-100"
                                                        : "bg-green-50 text-green-600 active:bg-green-100"
                                                }`}
                                            >
                                                {member.isMember ? "Xóa VIP" : "+ VIP"}
                                            </button>
                                            {adminConfig?.adminId !== member.userID && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetAdmin(member)}
                                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-600 active:bg-purple-100 transition-colors"
                                                >
                                                    👑
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default AdminPage;
