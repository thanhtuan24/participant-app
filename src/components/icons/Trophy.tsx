import React from "react";

const TrophyIcon: React.FC<any> = () => (
    <svg
        width="44"
        height="45"
        viewBox="0 0 44 45"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M31 6.5H13C12.45 6.5 12 6.95 12 7.5V12.5C12 18.02 16.48 22.5 22 22.5C27.52 22.5 32 18.02 32 12.5V7.5C32 6.95 31.55 6.5 31 6.5Z"
            fill="url(#trophy_grad)"
        />
        <path
            d="M12 8.5H8C7.45 8.5 7 8.95 7 9.5V12.5C7 15.26 9.24 17.5 12 17.5V8.5Z"
            fill="url(#trophy_grad)"
            opacity="0.7"
        />
        <path
            d="M36 8.5H32V17.5C34.76 17.5 37 15.26 37 12.5V9.5C37 8.95 36.55 8.5 36 8.5Z"
            fill="url(#trophy_grad)"
            opacity="0.7"
        />
        <path
            d="M24 22.5V28.5H20V22.5"
            stroke="url(#trophy_grad)"
            strokeWidth="2"
            fill="none"
        />
        <path
            d="M16 30.5H28C28.55 30.5 29 30.95 29 31.5V33.5C29 34.05 28.55 34.5 28 34.5H16C15.45 34.5 15 34.05 15 33.5V31.5C15 30.95 15.45 30.5 16 30.5Z"
            fill="url(#trophy_grad)"
        />
        <path
            d="M14 36.5H30C30.55 36.5 31 36.95 31 37.5C31 38.05 30.55 38.5 30 38.5H14C13.45 38.5 13 38.05 13 37.5C13 36.95 13.45 36.5 14 36.5Z"
            fill="url(#trophy_grad)"
            opacity="0.6"
        />
        <defs>
            <linearGradient
                id="trophy_grad"
                x1="22"
                y1="38.5"
                x2="22"
                y2="6.5"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#D4A017" />
                <stop offset="1" stopColor="#FFD700" />
            </linearGradient>
        </defs>
    </svg>
);

export default TrophyIcon;
