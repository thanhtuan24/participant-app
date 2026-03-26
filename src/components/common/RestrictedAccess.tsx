import React from "react";
import { useStore } from "@store";

const RestrictedAccess: React.FC = () => {
    const user = useStore(state => state.user);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-[#FFF3E0] flex items-center justify-center mb-5">
                <span className="text-4xl">🔒</span>
            </div>

            {/* Greeting */}
            <h2 className="text-xl font-bold text-[#141415] mb-2">
                Xin chào{user?.name ? `, ${user.name}` : ''}!
            </h2>

            {/* Message */}
            <p className="text-[#767A7F] text-base leading-relaxed mb-6 max-w-[280px]">
                Đây là ứng dụng nội bộ dành cho thành viên câu lạc bộ.
                Bạn hiện chưa có trong danh sách thành viên.
            </p>

            {/* Hint */}
            <div className="bg-[#F4F5F6] rounded-xl px-5 py-3 max-w-[300px]">
                <p className="text-sm text-[#767A7F]">
                    Vui lòng liên hệ quản trị viên nếu bạn là thành viên để được cấp quyền truy cập.
                </p>
            </div>
        </div>
    );
};

export default RestrictedAccess;
