import * as Icon from "@components/icons";
import { Utility } from "@dts";
import SocialInsuranceLogo from "@assets/logo-social-insurance.png";
import Youtube from "@assets/youtube.png";
import Location from "@assets/location.png";
import Identification from "@assets/id-card.png";
import InternalPhone from "@assets/internal-phone.png";
import SocialInsurranceNumber from "@assets/social-insurance-number.png";
import Benefit from "@assets/benefits.png";
import Renew from "@assets/files.png";
import { CURRENT_DATE, FORMAT_DATE } from "./common";
import { formatDate } from "@utils/date-time";

const now = new Date();


export const participantDate = () => {
    let date = "";
    if (CURRENT_DATE.getHours() >= 0 && CURRENT_DATE.getHours() < 6) {
        date = formatDate(CURRENT_DATE, FORMAT_DATE);
    } else {
        const tomorrow = new Date(now.getTime() + 86400000); // add 24 hours
        date = formatDate(tomorrow,FORMAT_DATE);
    }
    
    return date;
}
const currentDateRegister = `Đăng ký tham gia`;
export const APP_UTILITIES: Array<Utility> = [
    {
        key: "feedback",
        label: currentDateRegister,
        icon: Icon.PenIcon,
        path: "/create-feedback",
    },
    {
        key: "create-schedule-appointment",
        label: "Xem lịch đã đăng ký",
        icon: Icon.CalendarIcon,
        path: "/create-schedule-appointment",
    },
    {
        key: "tournament",
        label: "Giải đấu",
        icon: Icon.TrophyIcon,
        path: "/tournaments",
    },
    {
        key: "challenge",
        label: "Tạo kèo",
        icon: Icon.SwordsIcon,
        path: "/challenges",
    },

    // {
    //     key: "goverment",
    //     label: "Cổng dịch vụ công quốc gia",
    //     icon: Icon.GlobeIcon,
    //     link: "https://dichvucong.gov.vn/",
    // },
    // {
    //     key: "file-search",
    //     label: "Kiểm tra số lượng hiện tại",
    //     icon: Icon.SearchIcon,
    //     path: "/search",
    // },
];

export const CONTACTS: Array<Utility> = [
    {
        key: "social-insurance",
        label: "BHXH TP Thủ Đức",
        link: "",
        iconSrc: SocialInsuranceLogo,
    },
    {
        key: "si-number",
        label: "Số tài khoản Thu BHXH",
        link: "",
        iconSrc: SocialInsurranceNumber,
    },
    {
        key: "internal-number",
        label: "Số nội bộ tổ nghiệp vụ",
        link: "",
        iconSrc: InternalPhone,
    },
    {
        key: "department",
        label: "Điểm thu BHXH, BHYT",
        link: "",
        iconSrc: Location,
    },
    {
        key: "update-identification",
        label: "Cập nhật Mã định danh / CCCD",
        link: "",
        iconSrc: Identification,
    },
    {
        key: "youtube",
        label: "Youtube",
        link: "",
        iconSrc: Youtube,
    },
];

export const PROCEDURES: Array<Utility> = [
    {
        key: "renew",
        label: "Gia hạn thẻ BHYT trực tuyến",
        link: "",
        iconSrc: Renew,
    },
    {
        key: "benefit",
        label: "Các chế độ BHXH",
        link: "",
        iconSrc: Benefit,
    },
];
