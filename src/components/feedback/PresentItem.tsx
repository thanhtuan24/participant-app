import { PartiItem } from "@dts";
import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Icon, Box, Avatar } from "zmp-ui";

const Container = styled.div`
    ${tw`py-3 px-1 `}
`;

const HeaderContainer = styled.div`
    ${tw`grid-cols-2 flex justify-between gap-1 mb-2 text-[12px] leading-5`}
`;

const TimeContainer = styled.div`
    ${tw`block pl-4 gap-2 text-[#767A7F] text-lg h-fit`}
`;
const FeedbackType = styled.div`
    ${tw`border-[#D7EDFF] border flex flex-col mr-4 text-right items-end w-fit text-sm px-1 py-0.5 font-medium justify-center text-[#046DD6] rounded-xl font-medium`}
`;

const AvatarType = styled.div`
    ${tw`border-[#D7EDFF] gap-1 flex text-right items-center w-fit text-sm px-1 py-0.5 font-medium justify-end text-[#046DD6] rounded-xl font-medium`}
`;


const UsernameText = styled.div`
    ${tw``}
`;

const BodyContainer = styled.div`
    ${tw`text-[#141414]`}
`;

const SmallText = styled.div`
  ${tw`block font-bold text-sm`}
`;

const Content = styled.div`
    ${tw`block  [line-clamp: 3]`}
`;


export interface ParticipantItemProps {
    data: PartiItem;
    isPaid?: boolean;
}

// Helper function to format time to HH:MM:SS
// Hàm định dạng timestamp
const formatRegistrationTime = (timestamp: number) => {
    if (!timestamp) return '';
    const dateObject = new Date(timestamp.toString().length < 11 ? timestamp * 1000 : timestamp);


    // Lấy từng thành phần
    const month = dateObject.getMonth() + 1; // Lấy tháng (0-11), nên phải +1
    const day = dateObject.getDate(); // Lấy ngày, vd: 1

    const hours = dateObject.getHours(); // Lấy giờ, vd: 17
    const minutes = dateObject.getMinutes(); // Lấy phút, vd: 31

    // Thêm số 0 đằng trước cho các số có 1 chữ số (ví dụ: 7 -> "07")
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');


    // Ghép thành chuỗi theo ý muốn
    const customFormattedString = `${paddedHours}:${paddedMinutes}-${paddedDay}/${paddedMonth}`;

    // Kết quả sẽ là: "Ngày 01/07/2025 lúc 17:31
    return customFormattedString;
};

const ParticipantItem: React.FC<ParticipantItemProps> = ({ data, isPaid }) => {
    const formattedTime = data.timestamp ? formatRegistrationTime(data.timestamp) : '';

    return (
        <Container>
            <HeaderContainer>
                <TimeContainer>
                    <UsernameText>{(data.username)}</UsernameText>
                    {/* <Icon size={15} icon="zi-clock-1" /> */}
                    <div className="flex items-center gap-2">
                         <SmallText style={{ color: data.isMember ? "#4AB5AA" : "orange" }}>{data.isMember ? "Thành viên" : "Vãng lai"}</SmallText>
                         {isPaid && (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                                <Icon icon="zi-check-circle-solid" size={12} />
                                <span className="text-[9px] font-bold">ĐÃ ĐÓNG QUỸ</span>
                            </div>
                         )}
                    </div>
                    
                    {data.isMember ?
                        (<SmallText style={{ color: data.numberRegistered > 7 ? "#00FF77" : data.numberRegistered > 3 ? "#F3DA74" : "red" }}>Số ngày đã đi:{data.numberRegistered}</SmallText>)
                        : (
                            ""
                        )}
                </TimeContainer>
                <AvatarType>
                    <Avatar src={data.avatar}>
                        {data.username}
                    </Avatar>

                    <FeedbackType
                        style={{
                            backgroundColor: data.status === "yes" ? "rgba(18, 174, 226, 0.1)" : (data.status === "no" ? "orange" : "grey"),
                            color: data.status === "yes" ? "#12AEE2" : "white"
                        }}
                    ><div style={{
                        display: 'flex',
                        flexDirection: 'column', // Xếp các phần tử theo chiều dọc
                        alignItems: 'center'      // Căn giữa theo chiều ngang
                    }}>
                            <span>{data.status === "yes" ? "Đã đăng ký" : (data.status === "no" ? "Không tham gia" : "Không đăng ký")}</span>
                            {data.status === "yes" && formattedTime && <span style={{ fontSize: '0.8em', marginTop: '2px' }}>{formattedTime}</span>}

                        </div>
                    </FeedbackType>
                </AvatarType>
            </HeaderContainer>
        </Container>
    );
};

export default ParticipantItem;
