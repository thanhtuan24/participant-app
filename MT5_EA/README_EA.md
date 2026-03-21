# Hướng Dẫn Sử Dụng Discord Alert EA (Version 2.1)

EA này cung cấp tính năng cảnh báo giá cực mạnh qua:
1.  **Vùng giá cố định (Zone)**.
2.  **Vẽ Trendline/Line/Hộp**: Giá chạm/cắt qua -> Báo.
3.  **Tự động nhận diện mô hình**: Hai Đỉnh (Double Top) và Hai Đáy (Double Bottom).

## 1. Cài Đặt Chung
*   Copy `DiscordAlertEA.mq5` vào thư mục `Experts`.
*   Cấp quyền WebRequest cho `https://discord.com` trong **Tools -> Options -> Expert Advisors**.
*   Bật **Allow DLL imports** (nếu cần, thường EA này không dùng DLL).

## 2. Các Tính Năng & Input

### Group: Discord Settings
*   **DiscordWebhookUrl**: Link Webhook.
*   **DiscordMention**: Tag `@everyone`, `@here` hoặc `None`.
*   **UseDiscordTTS**: Đọc to tin nhắn cảnh báo.

### Group: Pattern Settings (MỚI)
*   **UsePatternAlert**: `true` để bật tìm mô hình 2 Đỉnh/2 Đáy tự động.
*   **PatternTolerance**: Độ lệch cho phép (Points). Ví dụ: 50 points.
    *   Nếu Đỉnh 1 giá 2000.0, Đỉnh 2 giá 2000.5 -> Báo alert vì lệch nhau ít.
*   **PatternLookback**: Số nến quét về quá khứ (Mặc định 50).

### Group: Alert Settings (Vẽ Line)
*   **UseTrendlineAlert**: `true` để dùng tính năng vẽ.
*   **TrendlinePrefix**: Đặt tên Line/Box bắt đầu bằng từ này (Mặc định `AlertLine`).
    *   *Ví dụ*: Vẽ Trendline, đổi tên thành `AlertLine1`.
*   **DebugMode**: `true` để xem log kiểm tra lỗi (tab Expert/Journal).

### Group: Mobile Settings
*   **UsePushNotification**: `true` để gửi về điện thoại (cần MetaQuotes ID).

## 3. Lưu Ý Khi Dùng Mô Hình (Pattern)
*   EA dùng chỉ báo **Fractals** mặc định để tìm đỉnh đáy.
*   Tín hiệu "Potential Double Top/Bottom" sẽ được gửi khi đỉnh/đáy thứ 2 được hình thành và xác nhận (thường sau 2 cây nến).
