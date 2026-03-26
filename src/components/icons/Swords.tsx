import React from "react";

const Swords: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.2 2L2 6.2l1.5 1.5 1.5-.5L7 9.2l-3.5 3.5 1.4 1.4 3.5-3.5 2 2-3.5 3.5 1.4 1.4L11.8 14l2 2-3.5 3.5 1.4 1.4L15.2 17l2 2-.5 1.5 1.5 1.5 4.2-4.2-1.5-1.5-1.5.5L17.4 14.8l3.5-3.5-1.4-1.4-3.5 3.5-8.4-8.4 3.5-3.5-1.4-1.4L6.2 4l-.5-1.5z" fill={color} />
        <path d="M17.8 2l4.2 4.2-1.5 1.5-1.5-.5-2 2-2.8-2.8 2-2-.5-1.5z" fill={color} opacity="0.5" />
    </svg>
);

export default Swords;
